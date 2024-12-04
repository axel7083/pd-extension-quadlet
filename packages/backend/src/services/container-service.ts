/**
 * @author axel7083
 */
import type {
  Disposable,
  containerEngine,
  ContainerInfo,
  ContainerEngineInfo,
  ContainerProviderConnection,
  ProviderContainerConnection,
} from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import type { SimpleContainerInfo } from '/@shared/src/models/simple-container-info';
import type { ProviderService } from './provider-service';
import type { ProviderContainerConnectionIdentifierInfo } from '/@shared/src/models/provider-container-connection-identifier-info';

interface Dependencies {
  containers: typeof containerEngine;
  providers: ProviderService;
}

export class ContainerService implements Disposable, AsyncInit {
  constructor(protected dependencies: Dependencies) {}

  async init(): Promise<void> {}

  protected async getEngineInfo(connection: ContainerProviderConnection): Promise<ContainerEngineInfo> {
    const infos = await this.dependencies.containers.listInfos({ provider: connection });
    if (infos.length !== 1) throw new Error(`cannot find matching info for connection ${connection.name}`);
    return infos[0];
  }

  async all(providerConnection: ProviderContainerConnectionIdentifierInfo): Promise<SimpleContainerInfo[]> {
    const containers = await this.dependencies.containers.listContainers();

    const provider = this.dependencies.providers.getProviderContainerConnection(providerConnection);
    const engineInfo = await this.getEngineInfo(provider.connection);

    return containers.reduce((output, current) => {
      // ensure it match provided connection
      if (current.engineId === engineInfo.engineId) {
        output.push(
          this.toSimpleContainerInfo(
            current,
            this.dependencies.providers.toProviderContainerConnectionDetailedInfo(provider),
          ),
        );
      }
      return output;
    }, [] as SimpleContainerInfo[]);
  }

  /**
   * This method return the ContainerProviderConnection corresponding to an engineId
   * @param engineId
   */
  async getProviderContainerConnectionByEngineId(engineId: string): Promise<ProviderContainerConnection> {
    for (const provider of this.dependencies.providers.getContainerConnections()) {
      const infos = await this.dependencies.containers.listInfos({ provider: provider.connection });
      if (infos.length === 0) continue;

      if (infos[0].engineId === engineId) return provider;
    }
    throw new Error('connection not found');
  }

  protected toSimpleContainerInfo(
    container: ContainerInfo,
    connection: ProviderContainerConnectionIdentifierInfo,
  ): SimpleContainerInfo {
    return {
      id: container.Id,
      name: container.Names[0] ?? '<none>',
      status: container.Status,
      image: container.Image,
      connection,
    };
  }

  dispose(): void {}
}
