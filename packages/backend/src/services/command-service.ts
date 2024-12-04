/**
 * @author axel7083
 */
import type { Disposable, commands as commandsApi } from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import { PODLET_GENERATE_CONTAINER_CMD } from '../utils/constants';
import type { ContainerInfoUI } from '../models/container-info-ui';
import type { RoutingService } from './routing-service';

interface Dependencies {
  commandsApi: typeof commandsApi,
  routing: RoutingService,
}

export class CommandService implements Disposable, AsyncInit {
  #disposables: Disposable[] = [];

  constructor(protected dependencies: Dependencies) {}

  async init(): Promise<void> {
    this.#disposables.push(
      this.dependencies.commandsApi.registerCommand(PODLET_GENERATE_CONTAINER_CMD, (containerInfo: ContainerInfoUI) => {
        console.log('[CommandService] received', containerInfo);
        return this.dependencies.routing.openQuadletCreate();
      }),
    );
  }

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
  }
}
