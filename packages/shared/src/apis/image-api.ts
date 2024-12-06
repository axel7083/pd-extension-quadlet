/**
 * @author axel7083
 */
import type { ProviderContainerConnectionIdentifierInfo } from '../models/provider-container-connection-identifier-info';
import type { SimpleImageInfo } from '../models/simple-image-info';

export abstract class ImageApi {
  static readonly CHANNEL: string = 'image-api';

  abstract all(provider: ProviderContainerConnectionIdentifierInfo): Promise<SimpleImageInfo[]>;
}
