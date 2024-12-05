/**
 * @author axel7083
 */
import type {
  env,
  Extension,
  extensions,
  process as processApi,
  ProviderContainerConnection,
  RunError,
  RunResult,
  Uri,
} from '@podman-desktop/api';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import { PodmanService } from './podman-service';
import type { PodmanExtensionApi } from '@podman-desktop/podman-extension-api';
import { PODMAN_EXTENSION_ID } from '../utils/constants';
import type { ProviderService } from './provider-service';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path/posix';

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
  rm: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(),
}));

const extensionsMock: typeof extensions = {
  getExtension: vi.fn(),
  onDidChange: vi.fn(),
} as unknown as typeof extensions;

const podmanExtensionApiMock: Extension<PodmanExtensionApi> = {
  id: PODMAN_EXTENSION_ID,
  extensionPath: '',
  extensionUri: {} as unknown as Uri,
  packageJSON: {},
  exports: {
    exec: vi.fn(),
  },
};

const processApiMock: typeof processApi = {

} as unknown as typeof processApi;

const providersMock: ProviderService = {} as ProviderService;

const WSL_PROVIDER_CONNECTION_MOCK: ProviderContainerConnection = {
  connection: {
    type: 'podman',
    vmType: 'WSL',
  },
  providerId: 'podman',
} as ProviderContainerConnection;

const NATIVE_PROVIDER_CONNECTION_MOCK: ProviderContainerConnection = {
  connection: {
    type: 'podman',
    vmType: undefined,
  },
  providerId: 'podman',
} as ProviderContainerConnection;

const RUN_RESULT_MOCK: RunResult = {
  stdout: 'dummy-stdout',
  stderr: 'dummy-stderr',
  command: 'dummy-command',
};

const HOMEDIR_MOCK = '/home/dummy-user';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(extensionsMock.getExtension).mockReturnValue(podmanExtensionApiMock);
  vi.mocked(podmanExtensionApiMock.exports.exec).mockResolvedValue(RUN_RESULT_MOCK);
  vi.mocked(homedir).mockReturnValue(HOMEDIR_MOCK);
});

function getPodmanService(options?: { isLinux?: boolean; isMac?: boolean; isWindows?: boolean }): PodmanService {
  return new PodmanService({
    env: {
      isLinux: options?.isLinux ?? false,
      isMac: options?.isMac ?? false,
      isWindows: options?.isWindows ?? false,
    } as typeof env,
    extensions: extensionsMock,
    processApi: processApiMock,
    providers: providersMock,
  });
}

test('init should subscribe to extensions events', async () => {
  const disposeMock = vi.fn();
  vi.mocked(extensionsMock.onDidChange).mockReturnValue({
    dispose: disposeMock,
  });
  const podman = getPodmanService();
  await podman.init();

  expect(extensionsMock.onDidChange).toHaveBeenCalledWith(expect.any(Function));

  podman.dispose();
  expect(disposeMock).toHaveBeenCalledOnce();
});

test('dispose should dispose extensions events subscriber', async () => {
  const disposeMock = vi.fn();
  vi.mocked(extensionsMock.onDidChange).mockReturnValue({
    dispose: disposeMock,
  });
  const podman = getPodmanService();
  await podman.init();

  podman.dispose();
  expect(disposeMock).toHaveBeenCalledOnce();
});

test('quadletExec should execute in podman machine on windows', async () => {
  const podman = getPodmanService({
    isWindows: true,
  });
  const result = await podman.quadletExec(WSL_PROVIDER_CONNECTION_MOCK, ['-user -dryrun']);

  expect(result).toStrictEqual(RUN_RESULT_MOCK);
  expect(podmanExtensionApiMock.exports.exec).toHaveBeenCalledWith(
    ['machine', 'ssh', '/usr/libexec/podman/quadlet -user -dryrun'],
    {
      connection: WSL_PROVIDER_CONNECTION_MOCK,
    },
  );
});

test('systemctlExec should return RunError if contains exit code', async () => {
  const runResult: RunError = {
    ...RUN_RESULT_MOCK,
    exitCode: 3,
    name: 'dummy',
    killed: false,
    message: 'dummy-error-message',
    cancelled: false,
  };

  vi.mocked(podmanExtensionApiMock.exports.exec).mockRejectedValue(runResult);

  const podman = getPodmanService({
    isWindows: true,
  });
  const result = await podman.systemctlExec(WSL_PROVIDER_CONNECTION_MOCK, []);
  expect(result).toStrictEqual(expect.objectContaining(RUN_RESULT_MOCK));
});

describe('writeTextFile', () => {
  test('linux', async () => {
    const destination = '~/.config/containers/systemd/dummy.container';
    const content = 'dummy-content';

    const podman = getPodmanService({
      isLinux: true,
    });
    await podman.writeTextFile(NATIVE_PROVIDER_CONNECTION_MOCK, destination, content);

    // podman exec api not called
    expect(podmanExtensionApiMock.exports.exec).not.toHaveBeenCalled();

    const resolved = join(HOMEDIR_MOCK, '.config', 'containers', 'systemd');

    // ensure parent directory created
    expect(mkdir).toHaveBeenCalledWith(resolved, { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      join(resolved, 'dummy.container'),
      content,
      { encoding: 'utf8' });
  });

  test.each(['windows', 'mac'])('%s', async (platform) => {
    const destination = '~/.config/containers/systemd/dummy.container';
    const content = 'dummy-content';

    const podman = getPodmanService({
      isWindows: platform === 'windows',
      isMac: platform === 'mac',
    });
    await podman.writeTextFile(WSL_PROVIDER_CONNECTION_MOCK, destination, content);

    // on windows we do not use node:fs
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();

    // mkdir
    expect(podmanExtensionApiMock.exports.exec).toHaveBeenCalledWith([
      'machine',
      'ssh',
      'mkdir -p ~/.config/containers/systemd',
    ], {
      connection: WSL_PROVIDER_CONNECTION_MOCK,
    });

    expect(podmanExtensionApiMock.exports.exec).toHaveBeenCalledWith([
      'machine',
      'ssh',
      `echo "${content}" > ${destination}`,
    ], {
      connection: WSL_PROVIDER_CONNECTION_MOCK,
    });
  });

});
