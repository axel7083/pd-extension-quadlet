/**
 * @author axel7083
 */
import { PodletApi } from '/@shared/src/apis/podlet-api';
import type { SimpleContainerInfo } from '/@shared/src/models/simple-container-info';
import type { PodletCliService } from '../services/podlet-cli-service';
import type { ProviderContainerConnectionIdentifierInfo } from '/@shared/src/models/provider-container-connection-identifier-info';
import type { QuadletType } from '/@shared/src/utils/quadlet-type';

interface Dependencies {
  podlet: PodletCliService;
}

export class PodletApiImpl extends PodletApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async generateContainer(container: SimpleContainerInfo): Promise<string> {
    const result = await this.dependencies.podlet.exec(['generate', 'container', container.id]);
    return result.stdout;
  }

  override async generate(options: {
    connection: ProviderContainerConnectionIdentifierInfo;
    type: QuadletType;
    resourceId: string;
  }): Promise<string> {
    const result = await this.dependencies.podlet.exec(['generate', options.type, options.resourceId]);
    return result.stdout;
  }

  override async isInstalled(): Promise<boolean> {
    return this.dependencies.podlet.isInstalled();
  }

  override install(): Promise<void> {
    return this.dependencies.podlet.installLasted();
  }
}
