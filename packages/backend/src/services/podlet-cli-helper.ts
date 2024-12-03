/**
 * @author axel7083
 */
import type { Octokit } from '@octokit/rest';
import type { env, window, process as processApi, cli as cliApi } from '@podman-desktop/api';
import path from 'node:path';
import os from 'node:os';

export interface PodletCliDependencies {
  storagePath: string;
  octokit: Octokit;
  env: typeof env;
  window: typeof window;
  processApi: typeof processApi;
  cliApi: typeof cliApi;
}

export abstract class PodletCliHelper {
  protected constructor(protected readonly dependencies: PodletCliDependencies) {}

  /**
   * @return the platform dependant name of the executable (windows podlet.exe, linux/mac podlet)
   * @protected
   */
  protected getPodletExecutableName(): string {
    let fileExtension = '';
    if (this.dependencies.env.isWindows) {
      fileExtension = '.exe';
    }
    return `podlet${fileExtension}`;
  }

  /**
   * @return the system path where we expect to install podlet
   * @protected
   */
  protected getPodletSystemPath(): string {
    const executable = this.getPodletExecutableName();
    if (this.dependencies.env.isWindows) {
      return path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps', `${executable}.exe`);
    } else {
      return path.join('/usr/local/bin', executable);
    }
  }

  /**
   * @return the executable path in the extension storage
   */
  getPodletExtensionPath(): string {
    return path.resolve(this.dependencies.storagePath, this.getPodletExecutableName());
  }

  /**
   */
  protected async wherePodlet(): Promise<string> {
    const executable = this.getPodletExecutableName();
    // grab full path for Linux and mac
    if (this.dependencies.env.isLinux || this.dependencies.env.isMac) {
      try {
        const { stdout: fullPath } = await this.dependencies.processApi.exec('which', [executable]);
        return fullPath;
      } catch (err) {
        console.warn('Error getting full path', err);
      }
    } else if (this.dependencies.env.isWindows) {
      // grab full path for Windows
      try {
        const { stdout: fullPath } = await this.dependencies.processApi.exec('where.exe', [executable]);
        // remove all line break/carriage return characters from full path
        return fullPath.replace(/(\r\n|\n|\r)/gm, '');
      } catch (err) {
        console.warn('Error getting full path', err);
      }
    }

    throw new Error(`binary ${executable} not found.`);
  }
}
