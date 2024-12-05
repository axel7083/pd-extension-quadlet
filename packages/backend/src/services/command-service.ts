/**
 * @author axel7083
 */
import type { Disposable, commands as commandsApi, ProviderContainerConnection } from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import { PODLET_GENERATE_CONTAINER_CMD } from '../utils/constants';
import type { ContainerInfoUI } from '../models/container-info-ui';
import type { RoutingService } from './routing-service';
import type { ContainerService } from './container-service';
import type { ProviderService } from './provider-service';

interface Dependencies {
  commandsApi: typeof commandsApi;
  routing: RoutingService;
  containers: ContainerService;
  providers: ProviderService;
}

export class CommandService implements Disposable, AsyncInit {
  #disposables: Disposable[] = [];

  constructor(protected dependencies: Dependencies) {}

  async init(): Promise<void> {
    this.#disposables.push(
      this.dependencies.commandsApi.registerCommand(
        PODLET_GENERATE_CONTAINER_CMD,
        this.routeToQuadletCreateContainer.bind(this),
      ),
    );
  }

  protected async routeToQuadletCreateContainer(container: ContainerInfoUI): Promise<void> {
    // 1. Get the {@link ProviderContainerConnection} by engine id
    const provider: ProviderContainerConnection =
      await this.dependencies.containers.getProviderContainerConnectionByEngineId(container.engineId);
    // 2. Transform the ProviderContainerConnection in ProviderContainerConnectionDetailedInfo
    const providerIdentifier = this.dependencies.providers.toProviderContainerConnectionDetailedInfo(provider);
    // 3. Open the quadlet create page
    return this.dependencies.routing.openQuadletCreateContainer(providerIdentifier, container.id);
  }

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
  }
}
