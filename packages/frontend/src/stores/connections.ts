/**
 * @author axel7083
 */
import { RPCReadable } from '/@/utils/rpcReadable';
import { Messages } from '/@shared/src/messages';
import { providerAPI } from '/@/api/client';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';

export const providerConnectionsInfo = RPCReadable<ProviderContainerConnectionDetailedInfo[]>(
  [],
  [Messages.UPDATE_PROVIDERS],
  providerAPI.all,
);
