/**
 * @author axel7083
 */
import type { ProviderContainerConnectionIdentifierInfo } from './provider-container-connection-identifier-info';

export interface QuadletInfo {
  id: string;
  // absolute path in the machine
  path: string;
  isActive?: boolean;

  // raw content of the service file
  content: string;
  // the connection linked
  connection: ProviderContainerConnectionIdentifierInfo;
}
