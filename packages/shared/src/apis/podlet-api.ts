/**
 * @author axel7083
 */
import type { SimpleContainerInfo } from '../models/simple-container-info';

export abstract class PodletApi {
  static readonly CHANNEL: string = 'podlet-api';

  abstract generateContainer(container: SimpleContainerInfo): Promise<string>;
}
