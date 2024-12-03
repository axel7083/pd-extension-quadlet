/**
 * @author axel7083
 */
import type { PodmanService } from '../services/podman-service';
import { ProviderApi } from '/@shared/src/apis/provide-api';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';

interface Dependencies {
  podman: PodmanService;
}

export class ProviderApiImpl extends ProviderApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async all(): Promise<ProviderContainerConnectionDetailedInfo[]> {
    return this.dependencies.podman.allProviderContainerConnectionInfo();
  }
}
