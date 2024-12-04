/**
 * @author axel7083
 */
import type { env, window, process as processApi, cli as cliApi, CliTool } from '@podman-desktop/api';
import { expect, test, vi, beforeEach } from 'vitest';
import { PodletCliService } from './podlet-cli-service';
import type { Octokit } from '@octokit/rest';
import type { PodletCliDependencies } from './podlet-cli-helper';

const processApiMock: typeof processApi = {} as unknown as typeof processApi;
const cliMock: typeof cliApi = {
  createCliTool: vi.fn(),
} as unknown as typeof cliApi;
const windowMock: typeof window = {} as unknown as typeof window;
const octokitMock: Octokit = {} as unknown as Octokit;

beforeEach(() => {
  vi.resetAllMocks();
});

const STORAGE_PATH_MOCK = 'dummy-storage-path';

class PodletCliServiceTest extends PodletCliService {
  constructor(dependencies: PodletCliDependencies) {
    super(dependencies);
  }

  public override async getPodletVersion(executable: string): Promise<string> {
    return super.getPodletVersion(executable);
  }

  public override getWindowsAssetName(arch: string): string {
    return super.getWindowsAssetName(arch);
  }

  public override getMacAssetName(arch: string): string {
    return super.getMacAssetName(arch);
  }

  public override getLinuxAssetName(arch: string): string {
    return super.getLinuxAssetName(arch);
  }

  public override async extractPodletExecutable(options: {
    archive: string;
    assetName: string;
    destination: string;
    tmp: string;
  }): Promise<void> {
    return super.extractPodletExecutable(options);
  }

  public override async makeExecutable(filePath: string): Promise<void> {
    return super.makeExecutable(filePath);
  }
}

function getPodletCliService(options?: { isLinux?: boolean; isMac?: boolean; isWindows?: boolean }): PodletCliService {
  return new PodletCliServiceTest({
    env: {
      isLinux: options?.isLinux ?? false,
      isMac: options?.isMac ?? false,
      isWindows: options?.isWindows ?? false,
    } as typeof env,
    processApi: processApiMock,
    cliApi: cliMock,
    window: windowMock,
    octokit: octokitMock,
    storagePath: STORAGE_PATH_MOCK,
  });
}

test('init should create cli tool', async () => {
  const podlet = getPodletCliService();
  await podlet.init();

  expect(cliMock.createCliTool).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'podlet',
      displayName: 'Podlet',
    }),
  );
});

test('dispose should dispose cli tool', async () => {
  const disposeMock = vi.fn();
  vi.mocked(cliMock.createCliTool).mockReturnValue({
    dispose: disposeMock,
  } as unknown as CliTool);
  const podlet = getPodletCliService();
  await podlet.init();

  podlet.dispose();
  expect(disposeMock).toHaveBeenCalledOnce();
});
