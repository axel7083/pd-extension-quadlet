/**
 * @author axel7083
 */
import type {
  Disposable, ImageInfo,
} from '@podman-desktop/api';
import type { AsyncInit } from '../utils/async-init';
import type { ProviderService } from './provider-service';
import type { EngineHelperDependencies } from './engine-helper';
import { EngineHelper } from './engine-helper';
import type { SimpleImageInfo } from '/@shared/src/models/simple-image-info';
import type {
  ProviderContainerConnectionIdentifierInfo,
} from '/@shared/src/models/provider-container-connection-identifier-info';

interface Dependencies extends EngineHelperDependencies {
  providers: ProviderService;
}

export class ImageService extends EngineHelper<Dependencies> implements Disposable, AsyncInit {

  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async init(): Promise<void> {}
  dispose(): void {}

  async all(providerConnection: ProviderContainerConnectionIdentifierInfo): Promise<SimpleImageInfo[]> {
    const provider = this.dependencies.providers.getProviderContainerConnection(providerConnection);

    const images = await this.dependencies.containers.listImages({
      provider: provider.connection,
    });

    return images.map((image) => this.toSimpleImageInfo(image, providerConnection));
  }

  protected toSimpleImageInfo(imageInfo: ImageInfo, connection: ProviderContainerConnectionIdentifierInfo): SimpleImageInfo {
    return {
      id: imageInfo.Id,
      name: imageInfo.RepoTags?.[0] ?? imageInfo.Id,
      connection,
    };
  }
}
