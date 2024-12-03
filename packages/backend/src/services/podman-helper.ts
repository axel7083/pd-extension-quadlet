/**
 * @author axel7083
 */
import type {
  env,
  extensions as Extensions,
  process as ProcessApi,
  process as ProcessCore,
  provider as Provider,
  ProviderContainerConnection,
} from '@podman-desktop/api';
import type { PodmanExtensionApi } from '@podman-desktop/podman-extension-api';
import { PODMAN_EXTENSION_ID } from '../utils/constants';
import type { ProviderContainerConnectionIdentifierInfo } from '/@shared/src/models/provider-container-connection-identifier-info';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';

export interface PodmanDependencies {
  extensions: typeof Extensions;
  providers: typeof Provider;
  env: typeof env;
  processApi: typeof ProcessApi;
}

export abstract class PodmanHelper {
  protected constructor(protected dependencies: PodmanDependencies) {}

  /**
   * Native exec on the host machine
   * @protected
   */
  protected get exec(): typeof ProcessCore.exec {
    return this.dependencies.processApi.exec;
  }

  protected get isLinux(): boolean {
    return this.dependencies.env.isLinux;
  }

  protected get isWindows(): boolean {
    return this.dependencies.env.isWindows;
  }

  protected get isMac(): boolean {
    return this.dependencies.env.isMac;
  }

  // smart podman extension api getter with some cache
  #podman: PodmanExtensionApi | undefined;
  protected get podman(): PodmanExtensionApi {
    if (!this.#podman) {
      this.#podman = this.getPodmanExtension();
    }
    return this.#podman;
  }

  protected resetPodmanExtensionApiCache(): void {
    this.#podman = undefined;
  }

  protected getPodmanExtension(): PodmanExtensionApi {
    const podman = this.dependencies.extensions.getExtension(PODMAN_EXTENSION_ID);
    if (!podman) throw new Error('podman extension not found');

    if (!('exec' in podman.exports) || typeof podman.exports.exec !== 'function') {
      throw new Error('invalid podman extension exports');
    }

    return podman.exports;
  }

  public allProviderContainerConnectionInfo(): ProviderContainerConnectionDetailedInfo[] {
    return this.dependencies.providers.getContainerConnections().map((connectionInfo: ProviderContainerConnection) => ({
      providerId: connectionInfo.providerId,
      name: connectionInfo.connection.name,
      status: connectionInfo.connection.status(),
      vmType: connectionInfo.connection.vmType,
    }));
  }

  public getProviderContainerConnection({
    providerId,
    name,
  }: ProviderContainerConnectionIdentifierInfo): ProviderContainerConnection {
    const provider = this.dependencies.providers
      .getContainerConnections()
      .find(connection => connection.providerId === providerId && connection.connection.name === name);
    if (!provider)
      throw new Error(
        `cannot find provider container connection with providerId ${providerId} and connection name ${name}`,
      );
    return provider;
  }
}
