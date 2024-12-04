/**
 * @author axel7083
 */
import type { Disposable, ProviderContainerConnection, RunError, RunResult } from '@podman-desktop/api';
import type { PodmanDependencies } from './podman-helper';
import { PodmanHelper } from './podman-helper';
import type { AsyncInit } from '../utils/async-init';

export class PodmanService extends PodmanHelper implements Disposable, AsyncInit {
  #extensionsEventDisposable: Disposable | undefined;

  constructor(dependencies: PodmanDependencies) {
    super(dependencies);
  }

  async init(): Promise<void> {
    // track if podman extension is disabled
    this.#extensionsEventDisposable = this.dependencies.extensions.onDidChange(() => {
      this.resetPodmanExtensionApiCache(); // reset podman cache
    });
  }

  /**
   * Feel very hacky
   * @param connection
   * @param path
   */
  async readTextFile(connection: ProviderContainerConnection, path: string): Promise<string> {
    const result = await this.internalExecute({
      connection: connection,
      args: [],
      command: `cat "${path}"`,
    });
    return result.stdout;
  }

  /**
   * Feel very hacky
   * @param connection
   * @param path
   * @param content
   */
  async writeTextFile(connection: ProviderContainerConnection, path: string, content: string): Promise<void> {
    await this.internalExecute({
      connection: connection,
      args: [],
      command: `echo "${content}" > ${path}`,
    });
  }

  /**
   * This method execute a given command in the podman machine
   * @remarks if the podman connection is native, the command will be executed on the host.
   * @dangerous
   * @protected
   */
  protected internalExecute(options: {
    connection: ProviderContainerConnection;
    command: string;
    args?: string[];
  }): Promise<RunResult> {
    const { connection, command, args = [] } = options;

    // let's check for podman native (only supported on linux)
    if (this.isLinux && connection.connection.vmType === undefined) {
      console.warn('provider do not have a VMType, considering native podman linux.');
      return this.exec(command, args);
    }

    // throw an error if vmType is undefined on non-linux platform
    if (connection.connection.vmType === undefined) {
      throw new Error(
        `connection ${options.connection.connection.name} of provider ${connection.providerId} vmType is undefined: not supported on non linux platform`,
      );
    }

    const sshCommand = ['machine', 'ssh', `${command} ${args.join(' ')}`];
    console.debug('[PodmanService] ssh command', sshCommand);

    return this.podman.exec(sshCommand, {
      connection: connection,
    });
  }

  /**
   * @privateRemarks We do not expose {@link internalExecute} for security purpose, so we must expose the quadlet exec
   * @param connection
   * @param args
   */
  quadletExec(connection: ProviderContainerConnection, args: string[]): Promise<RunResult> {
    return this.internalExecute({
      connection,
      command: '/usr/libexec/podman/quadlet',
      args: args,
    });
  }

  /**
   * systemctl has a weird specificity to change the return code depending on the status.
   * | value   | Description in LSB                             | Use in systemd                     |
   * | :------ | :--------------------------------------------  | :--------------------------------- |
   * | 0       | program is running or service is OK            | unit is active                     |
   * | 1       | program is dead and /var/run pid file exists   | unit not failed (used by is-failed)|
   * | 2       | program is dead and /var/lock lock file exists | unused                             |
   * | 3       | program is not running                         | unit is not active                 |
   * | 4       | program or service status is unknown           | no such unit                       |
   *
   * ref {@link https://www.freedesktop.org/software/systemd/man/latest/systemctl.html#Exit%20status}
   *
   * @privateRemarks We do not expose {@link internalExecute} for security purpose, so we must expose the systemctl exec
   *
   * @dangerous
   * @param connection
   * @param args
   */
  async systemctlExec(connection: ProviderContainerConnection, args: string[]): Promise<RunResult> {
    return this.internalExecute({
      connection,
      command: 'systemctl',
      args: args,
    }).catch((err: unknown) => {
      // check err is an RunError
      if (!err || typeof err !== 'object' || !('exitCode' in err)) {
        throw err;
      }
      return err as RunError;
    });
  }

  dispose(): void {
    this.#extensionsEventDisposable?.dispose();
  }
}
