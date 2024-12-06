/**
 * @author axel7083
 */
import type { ProviderContainerConnectionIdentifierInfo } from '/@shared/src/models/provider-container-connection-identifier-info';
import type { ImageService } from '../services/image-service';
import type { SimpleImageInfo } from '/@shared/src/models/simple-image-info';
import { ImageApi } from '/@shared/src/apis/image-api';

interface Dependencies {
  images: ImageService;
}

export class ImageApiImpl extends ImageApi {
  constructor(protected dependencies: Dependencies) {
    super();
  }

  override async all(provider: ProviderContainerConnectionIdentifierInfo): Promise<SimpleImageInfo[]> {
    return this.dependencies.images.all(provider);
  }
}
