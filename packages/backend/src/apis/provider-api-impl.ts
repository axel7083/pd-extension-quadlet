/**
 * @author axel7083
 */
import type { PodmanService } from '../services/podman-service';
import { ProviderApi } from '/@shared/src/apis/provide-api';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';
import type { ProviderService } from '../services/provider-service';

interface Dependencies {
  podman: PodmanService;
  providers: ProviderService;
}

export class ProviderApiImpl extends ProviderApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async all(): Promise<ProviderContainerConnectionDetailedInfo[]> {
    return this.dependencies.providers.all();
  }
}
