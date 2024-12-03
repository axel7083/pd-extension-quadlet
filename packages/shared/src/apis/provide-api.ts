/**
 * @author axel7083
 */
import type { ProviderContainerConnectionDetailedInfo } from '../models/provider-container-connection-detailed-info';

export abstract class ProviderApi {
  static readonly CHANNEL: string = 'provider-api';

  abstract all(): Promise<ProviderContainerConnectionDetailedInfo[]>;
}
