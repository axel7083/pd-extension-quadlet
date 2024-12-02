/**
 * @author axel7083
 */
import { RPCReadable } from '/@/utils/rpcReadable';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import { Messages } from '/@shared/src/messages';
import { quadletAPI } from '/@/api/client';

export const quadletsInfo = RPCReadable<QuadletInfo[]>([], [Messages.UPDATE_QUADLETS], quadletAPI.all);
