/**
 * @author axel7083
 */
import { PodletApi } from '/@shared/src/apis/podlet-api';
import type { SimpleContainerInfo } from '/@shared/src/models/simple-container-info';
import type { PodletCliService } from '../services/podlet-cli-service';

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
}
