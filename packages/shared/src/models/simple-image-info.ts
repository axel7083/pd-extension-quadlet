/**
 * @author axel7083
 */
import type { ProviderContainerConnectionIdentifierInfo } from './provider-container-connection-identifier-info';

export interface SimpleImageInfo {
  id: string;
  connection: ProviderContainerConnectionIdentifierInfo;
  name: string;
}