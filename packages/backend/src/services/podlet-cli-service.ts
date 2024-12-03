/**
 * @author axel7083
 */
import type { CliTool, Disposable } from '@podman-desktop/api';
import type extensionApi from '@podman-desktop/api';
import { PODLET_ORGANISATION, PODLET_REPOSITORY } from '../utils/constants';
import type { PodletCliDependencies} from './podlet-cli-helper';
import { PodletCliHelper } from './podlet-cli-helper';
import fs, { existsSync, promises } from 'node:fs';
import type { AsyncInit } from '../utils/async-init';
import os from 'node:os';
import path from 'node:path';

export interface PodletGithubReleaseArtifactMetadata extends extensionApi.QuickPickItem {
  tag: string;
  id: number;
}

export class PodletCliService extends PodletCliHelper implements Disposable, AsyncInit {
  #cliTool: CliTool | undefined;

  constructor(dependencies: PodletCliDependencies) {
    super(dependencies);
  }

  async init(): Promise<void> {
    // todo: register cli tool
    this.#cliTool = this.dependencies.cliApi.createCliTool({
      name: 'podlet',
      displayName: 'Podlet',
      markdownDescription: '',
      path: undefined,
      version: undefined,
      images: {
        icon: './icon.png',
      }
    });
  }

  // Provides last 5 majors releases from GitHub using the GitHub API
  // return name, tag and id of the release
  async getLastestsReleasesMetadata(): Promise<PodletGithubReleaseArtifactMetadata[]> {
    // Grab last 5 majors releases from GitHub using the GitHub API
    const lastReleases = await this.dependencies.octokit.repos.listReleases({
      owner: PODLET_ORGANISATION,
      repo: PODLET_REPOSITORY,
      per_page: 5,
    });

    return (
      lastReleases.data
        // filter out prerelease
        .filter(release => !release.prerelease)
        .map(release => {
          return {
            label: release.name ?? release.tag_name,
            tag: release.tag_name,
            id: release.id,
          };
        })
        .slice(0, 5)
    );
  }

  async getLatestVersionAsset(): Promise<PodletGithubReleaseArtifactMetadata> {
    const latestReleases = await this.getLastestsReleasesMetadata();
    return latestReleases[0];
  }

  async selectVersion(cliInfo?: extensionApi.CliTool): Promise<PodletGithubReleaseArtifactMetadata> {
    let releasesMetadata = await this.getLastestsReleasesMetadata();

    if (releasesMetadata.length === 0) throw new Error('cannot grab minikube releases');

    // if the user already has an installed version, we remove it from the list
    if (cliInfo) {
      releasesMetadata = releasesMetadata.filter(release => release.tag.slice(1) !== cliInfo.version);
    }

    // Show the quickpick
    const selectedRelease = await this.dependencies.window.showQuickPick(releasesMetadata, {
      placeHolder: 'Select Kind version to download',
    });

    if (!selectedRelease) {
      throw new Error('No version selected');
    }
    return selectedRelease;
  }

  /**
   * @remarks `podlet --version` return "podlet 0.3.0"
   * @param executable
   * @protected
   */
  protected async getPodletVersion(executable: string): Promise<string> {
    const result = await this.dependencies.processApi.exec(executable, ['--version']);
    return result.stdout.replace('podlet ', '').trim();
  }

  /**
   * search if podlet is available system-wide or in the extension folder
   */
  async findPodlet(): Promise<string | undefined> {
    try {
      return await this.wherePodlet();
    } catch (err: unknown) {
      console.debug(err);
    }

    const extensionPath = this.getPodletExtensionPath();
    if (fs.existsSync(extensionPath)) {
      return extensionPath;
    }
    return undefined;
  }

  protected getWindowsAssetName(arch: string): string {
    if (arch !== 'x64') throw new Error(`architecture ${arch} not supported`);
    return 'podlet-x86_64-pc-windows-msvc.zip';
  }

  protected getMacAssetName(arch: string): string {
    if (arch === 'x64') {
      return 'podlet-x86_64-apple-darwin.tar.xz';
    } else if (arch === 'arm64' || arch === 'aarch64') {
      return 'podlet-aarch64-apple-darwin.tar.xz';
    }
    throw new Error(`architecture ${arch} not supported`);
  }

  protected getLinuxAssetName(arch: string): string {
    if (arch !== 'x64') throw new Error(`architecture ${arch} not supported`);
    return 'podlet-x86_64-unknown-linux-gnu.tar.xz';
  }

  // Get the asset id of a given release number for a given operating system and architecture
  // operatingSystem: win32, darwin, linux (see os.platform())
  // arch: x64, arm64 (see os.arch())
  async getReleaseAssetId(releaseId: number): Promise<{ name: string, id: number }> {
    let assetName: string;
    if (this.dependencies.env.isWindows) {
      assetName = this.getWindowsAssetName(os.arch());
    } else if (this.dependencies.env.isMac) {
      assetName = this.getMacAssetName(os.arch());
    } else if (this.dependencies.env.isLinux) {
      assetName = this.getLinuxAssetName(os.arch());
    } else {
      throw new Error('invalid platform detected.');
    }

    const listOfAssets = await this.dependencies.octokit.repos.listReleaseAssets({
      owner: PODLET_ORGANISATION,
      repo: PODLET_REPOSITORY,
      release_id: releaseId,
      per_page: 60,
    });

    // search for the right asset
    const asset = listOfAssets.data.find(asset => assetName === asset.name);
    if (!asset) {
      throw new Error(`No asset found for ${os.platform()} and ${os.arch()}`);
    }

    return {
      name: asset.name,
      id: asset.id,
    };
  }

  // Download minikube from the artifact metadata: MinikubeGithubReleaseArtifactMetadata
  // this will download it to the storage bin folder as well as make it executable
  // return the path where the file has been downloaded
  async download(release: PodletGithubReleaseArtifactMetadata): Promise<string> {
    // Get asset id
    const { name: assetName, id: assetId } = await this.getReleaseAssetId(release.id);

    // Get the storage and check to see if it exists before we download kubectl
    const storageData = this.dependencies.storagePath;
    if (!existsSync(storageData)) {
      await promises.mkdir(storageData, { recursive: true });
    }

    // Download the asset and make it executable
    await this.downloadReleaseAsset(assetId, path.join(this.dependencies.storagePath, 'tmp', assetName));

    throw new Error('todo: uncompress the file + make executable');

    // await this.makeExecutable(podletExtensionPath);
    // return podletExtensionPath;
  }

  // download the given asset id
  async downloadReleaseAsset(assetId: number, destination: string): Promise<void> {
    const asset = await this.dependencies.octokit.repos.getReleaseAsset({
      owner: PODLET_ORGANISATION,
      repo: PODLET_REPOSITORY,
      asset_id: assetId,
      headers: {
        accept: 'application/octet-stream',
      },
    });

    // check the parent folder exists
    const parentFolder = path.dirname(destination);

    if (!fs.existsSync(parentFolder)) {
      await fs.promises.mkdir(parentFolder, { recursive: true });
    }
    // write the file
    await fs.promises.writeFile(destination, Buffer.from(asset.data as unknown as ArrayBuffer));
  }

  dispose(): void {
    this.#cliTool?.dispose();
  }
}
