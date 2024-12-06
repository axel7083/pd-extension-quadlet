/**
 * @author axel7083
 */
import type { SimpleContainerInfo } from '../models/simple-container-info';
import type { ProviderContainerConnectionIdentifierInfo } from '../models/provider-container-connection-identifier-info';
import type { QuadletTypeGenerate } from '../utils/quadlet-type';

export abstract class PodletApi {
  static readonly CHANNEL: string = 'podlet-api';

  abstract generateContainer(container: SimpleContainerInfo): Promise<string>;

  abstract generate(options: {
    connection: ProviderContainerConnectionIdentifierInfo;
    type: QuadletTypeGenerate;
    resourceId: string;
  }): Promise<string>;

  abstract install(): Promise<void>;
  abstract isInstalled(): Promise<boolean>;
}
