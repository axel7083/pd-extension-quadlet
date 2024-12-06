/**
 * @author axel7083
 */
import type { containerEngine, ContainerEngineInfo, ContainerProviderConnection } from '@podman-desktop/api';

export interface EngineHelperDependencies {
  containers: typeof containerEngine;
}

export abstract class EngineHelper<T extends  EngineHelperDependencies> {

  protected constructor(protected dependencies: T) {}

  protected async getEngineInfo(connection: ContainerProviderConnection): Promise<ContainerEngineInfo> {
    const infos = await this.dependencies.containers.listInfos({ provider: connection });
    if (infos.length !== 1) throw new Error(`cannot find matching info for connection ${connection.name}`);
    return infos[0];
  }
}
