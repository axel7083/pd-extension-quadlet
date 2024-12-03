/**
 * @author axel7083
 */

import type { Disposable, ProviderContainerConnection } from '@podman-desktop/api';
import type { QuadletServiceDependencies } from './quadlet-helper';
import { QuadletHelper } from './quadlet-helper';
import { QuadletDryRunParser } from '../utils/parsers/quadlet-dryrun-parser';
import type { Quadlet } from '../models/quadlet';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import type { AsyncInit } from '../utils/async-init';

export class QuadletService extends QuadletHelper implements Disposable, AsyncInit {
  #value: Map<ProviderContainerConnection, Quadlet[]>;
  #extensionsEventDisposable: Disposable | undefined;

  constructor(dependencies: QuadletServiceDependencies) {
    super(dependencies);
    this.#value = new Map<ProviderContainerConnection, Quadlet[]>();
  }

  /**
   * Transform the Map<ProviderContainerConnection, Quadlet[]> to a flat {@link QuadletInfo} array
   */
  override all(): QuadletInfo[] {
    return Array.from(this.#value).reduce((output, [provider, quadlets]) => {
      // adding all quadlets
      output.push(
        ...quadlets.map(quadlet => ({
          ...quadlet,
          connection: {
            providerId: provider.providerId,
            name: provider.connection.name,
          },
        })),
      );
      return output;
    }, [] as QuadletInfo[]);
  }

  async init(): Promise<void> {
    this.collectPodmanQuadlet().catch(console.error);
  }

  /**
   * The quadlet executable is installed at /usr/libexec/podman/quadlet on the podman machine
   * @protected
   * @param provider
   */
  protected async getQuadletVersion(provider: ProviderContainerConnection): Promise<string> {
    const result = await this.podman.quadletExec(provider, ['-version']);
    return result.stdout;
  }

  protected async getPodmanQuadlets(options: {
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin?: boolean;
  }): Promise<Quadlet[]> {
    const args: string[] = ['-dryrun'];
    if (!options.admin) {
      args.push('-user');
    }
    const result = await this.podman.quadletExec(options.provider, args);

    const parser = new QuadletDryRunParser(result.stdout);
    return parser.parse();
  }

  async collectPodmanQuadlet(): Promise<void> {
    this.#value.clear();

    const containerProviders: ProviderContainerConnection[] = this.providers.getContainerConnections();
    console.log(`[QuadletService] collectPodmanQuadlet found ${containerProviders.length} connections`);

    for (const provider of containerProviders) {
      // only care about podman connection
      if (provider.connection.type !== 'podman') {
        console.warn(
          `[QuadletService] ignoring connection ${provider.connection.name} of provider ${provider.providerId}, type is ${provider.connection.type}`,
        );
        continue;
      }

      // only care about started connection
      const status = provider.connection.status();
      if (status !== 'started') {
        console.warn(
          `[QuadletService] ignoring connection ${provider.connection.name} of provider ${provider.providerId}, status is ${status}`,
        );
        continue;
      }

      // 1. we check the systemctl version
      const systemctlVersion = await this.dependencies.systemd.getSystemctlVersion(provider);
      console.log(`[QuadletService] systemctlVersion ${systemctlVersion}`);

      // 2. check the quadlet version
      const quadletVersion = await this.getQuadletVersion(provider);
      console.log(
        `[QuadletService] found quadlet version ${quadletVersion} for connection ${provider.connection.name} of provider ${provider.providerId}`,
      );

      // TODO: check min version supported

      // 3. get the quadlets
      const quadlets = await this.getPodmanQuadlets({ provider, admin: false });
      console.log(`[QuadletService] quadlets dryrun provided ${quadlets.length} objects`);

      // 4. use systemd service to set the is active properties of quadlets
      const statuses = await this.dependencies.systemd.getActiveStatus({
        provider: provider,
        admin: false,
        services: quadlets.map(quadlet => quadlet.id),
      });

      console.log(`[QuadletService] getActiveStatus got`, statuses);

      for (const quadlet of quadlets) {
        if (quadlet.id in statuses) {
          quadlet.isActive = statuses[quadlet.id];
        }
      }

      this.#value.set(provider, quadlets);
      this.notify();
    }
  }

  /**
   * @remarks only refresh the statuses of ***known** quadlets, do not catch new ones.
   * todo: optimise ? paralele ?
   */
  async refreshQuadletsStatuses(): Promise<void> {
    for (const [provider, quadlets] of Array.from(this.#value.entries())) {
      const statuses = await this.dependencies.systemd.getActiveStatus({
        provider: provider,
        admin: false,
        services: quadlets.map(quadlet => quadlet.id),
      });

      for (const quadlet of quadlets) {
        if (quadlet.id in statuses) {
          quadlet.isActive = statuses[quadlet.id];
        }
      }

      this.#value.set(provider, quadlets);
    }
    this.notify();
  }

  dispose(): void {
    this.#value.clear();
    this.#extensionsEventDisposable?.dispose();
    this.#extensionsEventDisposable = undefined;
  }
}
