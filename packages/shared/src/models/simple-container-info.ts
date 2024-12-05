import type { ProviderContainerConnectionIdentifierInfo } from './provider-container-connection-identifier-info';

export interface SimpleContainerInfo {
  id: string;
  connection: ProviderContainerConnectionIdentifierInfo;
  state: 'running' | 'exited' | 'created' | string;
  name: string;
  image: string;
}
