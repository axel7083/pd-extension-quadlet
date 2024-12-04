import type { ProviderContainerConnectionIdentifierInfo } from './provider-container-connection-identifier-info';

export interface SimpleContainerInfo {
  id: string;
  connection: ProviderContainerConnectionIdentifierInfo;
  status: string;
  name: string;
  image: string;
}
