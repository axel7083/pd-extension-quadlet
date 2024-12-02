/**
 * @author axel7083
 */
import type { ProviderContainerConnectionInfo } from '../apis/provider-container-connection-info';

export interface QuadletInfo {
  id: string;
  // absolute path in the machine
  path: string;
  isActive?: boolean;

  // raw content of the service file
  content: string;
  // the connection linked
  connection: ProviderContainerConnectionInfo;
}
