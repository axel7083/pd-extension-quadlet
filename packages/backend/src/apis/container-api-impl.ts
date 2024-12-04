/**
 * @author axel7083
 */
import { ContainerApi } from '/@shared/src/apis/container-api';
import type { SimpleContainerInfo } from '/@shared/src/models/simple-container-info';
import type { ProviderContainerConnectionIdentifierInfo } from '/@shared/src/models/provider-container-connection-identifier-info';
import type { ContainerService } from '../services/container-service';

interface Dependencies {
  containers: ContainerService;
}

export class ContainerApiImpl extends ContainerApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async all(provider: ProviderContainerConnectionIdentifierInfo): Promise<SimpleContainerInfo[]> {
    return this.dependencies.containers.all(provider);
  }
}
