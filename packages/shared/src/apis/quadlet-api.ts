/**
 * @author axel7083
 */
import type { QuadletInfo } from '../models/quadlet-info';
import type { ProviderContainerConnectionInfo } from './provider-container-connection-info';

export abstract class QuadletApi {
  static readonly CHANNEL: string = 'quadlet-api';

  abstract all(): Promise<QuadletInfo[]>;
  abstract refresh(): Promise<void>;
  abstract start(connection: ProviderContainerConnectionInfo, id: string): Promise<boolean>;
  abstract stop(connection: ProviderContainerConnectionInfo, id: string): Promise<boolean>;
}
