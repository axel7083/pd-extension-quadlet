/**
 * @author axel7083
 */
import { RoutingApi } from '/@shared/src/apis/routing-api';
import type { RoutingService } from '../services/routing-service';
import type {
  ProviderContainerConnectionIdentifierInfo
} from '/@shared/src/models/provider-container-connection-identifier-info';
import type { ImageService } from '../services/image-service';

interface Dependencies {
  routing: RoutingService;
  images: ImageService;
}

export class RoutingApiImpl extends RoutingApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async readRoute(): Promise<string | undefined> {
    return this.dependencies.routing.read();
  }

  override async navigateToImage(options: {
    provider: ProviderContainerConnectionIdentifierInfo,
    image: string,
  }): Promise<void> {
    const image = await this.dependencies.images.searchImage(options.provider, options.image);
    if(!image) throw new Error(`No image found for ${options.image}.`);
    console.log('[RoutingApiImpl] found image', image);
    return this.dependencies.routing.openImageDetails(image.Id, image.engineId, image.RepoTags?.[0] ?? '');
  }
}
