/**
 * @author axel7083
 */
import type { SimpleContainerInfo } from '../models/simple-container-info';
import type { ProviderContainerConnectionIdentifierInfo } from '../models/provider-container-connection-identifier-info';

export abstract class ContainerApi {
  static readonly CHANNEL: string = 'container-api';

  abstract all(provider: ProviderContainerConnectionIdentifierInfo): Promise<SimpleContainerInfo[]>;
}
