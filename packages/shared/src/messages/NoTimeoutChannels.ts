import { getChannel } from './MessageProxy';
import { PodletApi } from '../apis/podlet-api';

export const noTimeoutChannels: string[] = [
  getChannel(PodletApi, 'install'),
];
