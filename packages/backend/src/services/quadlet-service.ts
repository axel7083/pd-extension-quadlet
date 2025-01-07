/**
 * @author axel7083
 */

import { ProgressLocation } from '@podman-desktop/api';
import type { Disposable, ProviderContainerConnection } from '@podman-desktop/api';
import type { QuadletServiceDependencies } from './quadlet-helper';
import { QuadletHelper } from './quadlet-helper';
import { QuadletDryRunParser } from '../utils/parsers/quadlet-dryrun-parser';
import type { Quadlet } from '../models/quadlet';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import type { AsyncInit } from '../utils/async-init';
import { join as joinposix } from 'node:path/posix';
import { load } from 'js-yaml';
import { QuadletTypeParser } from '../utils/parsers/quadlet-type-parser';
import type { SynchronisationInfo } from '/@shared/src/models/synchronisation';

export class QuadletService extends QuadletHelper implements Disposable, AsyncInit {
  // todo: find a better alternative, ProviderContainerConnection is not consistent
  #value: Map<ProviderContainerConnection, Quadlet[]>;
  #extensionsEventDisposable: Disposable | undefined;
  #synchronisation: Map<ProviderContainerConnection, number>;

  constructor(dependencies: QuadletServiceDependencies) {
    super(dependencies);
    this.#value = new Map<ProviderContainerConnection, Quadlet[]>();
    this.#synchronisation = new Map<ProviderContainerConnection, number>();
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

  async init(): Promise<void> {}

  public findQuadlet(options: { provider: ProviderContainerConnection; id: string }): Quadlet | undefined {
    for (const [provider, quadlets] of this.#value.entries()) {
      if (
        provider.providerId !== options.provider.providerId ||
        provider.connection.name !== options.provider.connection.name
      )
        continue;

      return quadlets.find(quadlet => quadlet.id === options.id);
    }
    return undefined;
  }

  /**
   * The quadlet executable is installed at /usr/libexec/podman/quadlet on the podman machine
   * @protected
   * @param provider
   */
  protected async getQuadletVersion(provider: ProviderContainerConnection): Promise<string> {
    const result = await this.podman.quadletExec({
      connection: provider,
      args: ['-version'],
    });
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
    const result = await this.podman.quadletExec({
      connection: options.provider,
      args,
    });

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

      this.update(provider, quadlets, false);
    }
    this.notify();
  }

  protected update(provider: ProviderContainerConnection, quadlets: Quadlet[], notify: boolean = true): void {
    this.#value.set(provider, quadlets);
    this.#synchronisation.set(provider, new Date().getTime());
    if (notify) this.notify();
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

      this.update(provider, quadlets, false);
    }
    this.notify();
  }

  protected splitResources(basename: string, content: string): { filename: string; content: string }[] {
    const resources = content.split('---');
    return resources.map(resource => {
      console.log('analying resource', resource);
      try {
        const type = new QuadletTypeParser(resource).parse();
        return {
          filename: `${basename}.${type.toLowerCase()}`,
          content: resource,
        };
        // eslint-disable-next-line sonarjs/no-ignored-exceptions
      } catch (err: unknown) {
        console.warn(err);
        load(resource);
        return {
          filename: `${basename}.yaml`,
          content: resource,
        };
      }
    });
  }

  async updateIntoMachine(options: {
    quadlet: string;
    path: string; // path to the quadlet file
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin?: boolean;
  }): Promise<void> {
    return this.dependencies.window.withProgress(
      {
        title: `Updating ${options.path}`,
        location: ProgressLocation.TASK_WIDGET,
      },
      async () => {
        // 1. save the quadlet
        try {
          console.debug(`[QuadletService] updating quadlet file to ${options.path}`);
          await this.dependencies.podman.writeTextFile(options.provider, options.path, options.quadlet);
        } catch (err: unknown) {
          console.error(`Something went wrong while trying to write file to ${options.path}`, err);
          throw err;
        }

        // 2. reload
        await this.dependencies.systemd.daemonReload({
          admin: options.admin ?? false,
          provider: options.provider,
        });

        //3. collect quadlets
        await this.collectPodmanQuadlet();
      },
    );
  }

  async saveIntoMachine(options: {
    quadlet: string;
    name: string; // name of the quadlet file E.g. `example.container`
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin?: boolean;
  }): Promise<void> {
    return this.dependencies.window.withProgress(
      {
        title: `Saving ${options.name} quadlet`,
        location: ProgressLocation.TASK_WIDGET,
      },
      async () => {
        // 0. detect all resources
        const resources = this.splitResources(options.name, options.quadlet);
        console.debug(`saving into machine: found ${resources.length} resources`);

        // for each resource
        for (const resource of resources) {
          console.debug(`saving ${resource.filename}`);

          // 1. write the file into the podman machine
          let destination: string;
          if (options.admin) {
            destination = joinposix('/etc/containers/systemd/', resource.filename);
          } else {
            destination = joinposix('~/.config/containers/systemd/', resource.filename);
          }

          // 2. write the file
          try {
            console.debug(`[QuadletService] writing quadlet file to ${destination}`);
            await this.dependencies.podman.writeTextFile(options.provider, destination, resource.content);
          } catch (err: unknown) {
            console.error(`Something went wrong while trying to write file to ${destination}`, err);
            throw err;
          }
        }

        // 3. reload
        await this.dependencies.systemd.daemonReload({
          admin: options.admin ?? false,
          provider: options.provider,
        });

        //4. collect quadlets
        await this.collectPodmanQuadlet();
      },
    );
  }

  async remove(options: {
    id: string;
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin?: boolean;
  }): Promise<void> {
    const quadlet = this.findQuadlet({
      provider: options.provider,
      id: options.id,
    });
    if (!quadlet) throw new Error(`quadlet with id ${options.id} not found`);

    // 1. remove the quadlet file
    console.debug(`[QuadletService] Deleting quadlet ${options.id} with path ${quadlet.path}`);
    await this.dependencies.podman.rmFile(options.provider, quadlet.path);

    // 2. reload systemctl
    console.debug(`[QuadletService] Reloading systemctl`);
    await this.dependencies.systemd.daemonReload({
      admin: options.admin ?? false,
      provider: options.provider,
    });

    // 3. update the list of quadlets
    return this.collectPodmanQuadlet();
  }

  /**
   * read the source of the given quadlet
   * @param options
   */
  async read(options: {
    id: string;
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin?: boolean;
  }): Promise<string> {
    const quadlet = this.findQuadlet({
      provider: options.provider,
      id: options.id,
    });
    if (!quadlet) throw new Error(`quadlet with id ${options.id} not found`);

    return await this.dependencies.podman.readTextFile(options.provider, quadlet.path);
  }

  getSynchronisationInfo(): SynchronisationInfo[] {
    return Array.from(this.#synchronisation.entries()).map(([provider, timestamp]) => ({
      connection: this.providers.toProviderContainerConnectionDetailedInfo(provider),
      timestamp: timestamp,
    }));
  }

  dispose(): void {
    this.#value.clear();
    this.#extensionsEventDisposable?.dispose();
    this.#extensionsEventDisposable = undefined;
  }
}
