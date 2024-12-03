/**
 * @author axel7083
 */

import type { ProviderContainerConnectionIdentifierInfo } from './provider-container-connection-identifier-info';

export interface ProviderContainerConnectionDetailedInfo extends ProviderContainerConnectionIdentifierInfo {
  status: 'started' | 'stopped' | 'starting' | 'stopping' | 'unknown';
  vmType?: string;
}
