/**
 * @author axel7083
 */
import type { provider as Provider, ProviderContainerConnection, Webview } from '@podman-desktop/api';

import { expect, test, vi, beforeEach } from 'vitest';
import { ProviderService } from './provider-service';

const providerMock: typeof Provider = {
  getContainerConnections: vi.fn(),
} as unknown as typeof Provider;

const webviewMock: Webview = {} as unknown as Webview;

const WSL_PROVIDER_CONNECTION_MOCK: ProviderContainerConnection = {
  connection: {
    type: 'podman',
    name: 'podman-machine',
    vmType: 'WSL',
    status: () => 'started',
  },
  providerId: 'podman',
} as ProviderContainerConnection;

beforeEach(() => {
  vi.resetAllMocks();
});

function getProviderService(): ProviderService {
  return new ProviderService({
    providers: providerMock,
    webview: webviewMock,
  });
}

test('init should create cli tool', async () => {
  vi.mocked(providerMock.getContainerConnections).mockReturnValue([WSL_PROVIDER_CONNECTION_MOCK]);

  const providers = getProviderService();
  const connections = providers.all();
  expect(connections).toHaveLength(1);
  expect(connections[0]).toStrictEqual({
    name: 'podman-machine',
    providerId: 'podman',
    status: 'started',
    vmType: 'WSL',
  });
});
