/**
 * @author axel7083
 */
import type { ProviderContainerConnection, RunError, RunResult } from '@podman-desktop/api';
import { Disposable } from '@podman-desktop/api';
import type { PodmanDependencies } from './podman-helper';
import { PodmanHelper } from './podman-helper';
import type { AsyncInit } from '../utils/async-init';
import { dirname } from 'node:path/posix';
import { writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { type ChildProcess, spawn } from 'node:child_process';
import { env } from 'node:process';

export class PodmanService extends PodmanHelper implements Disposable, AsyncInit {
  #disposables: Disposable[] = [];
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
    // linux native special case
    if (this.isLinux && connection.connection.vmType === undefined) {
      console.debug('[PodmanService] native connection using node:fs');
      return readFile(path, { encoding: 'utf8' });
    }

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
   * @param destination
   * @param content
   */
  async writeTextFile(connection: ProviderContainerConnection, destination: string, content: string): Promise<void> {
    // linux native special case
    if (this.isLinux && connection.connection.vmType === undefined) {
      console.debug('[PodmanService] native connection using node:fs');
      // 1. resolve homedir
      const resolved = destination.replace('~', homedir());
      // 2. mkdir parent directory
      await mkdir(dirname(resolved), { recursive: true });
      // 3. write file
      await writeFile(resolved, content, { encoding: 'utf8' });
      return;
    }

    // mkdir
    await this.internalExecute({
      connection: connection,
      args: ['-p', dirname(destination)],
      command: `mkdir`,
    });

    // write
    await this.internalExecute({
      connection: connection,
      args: [`"${content}"`, '>', destination],
      command: `echo`,
    });
  }

  /**
   * remove a given file in the podman machine
   * @dangerous
   * @param connection
   * @param path
   */
  async rmFile(connection: ProviderContainerConnection, path: string): Promise<void> {
    // linux native special case
    if (this.isLinux && connection.connection.vmType === undefined) {
      console.debug('[PodmanService] native connection using node:fs');
      return rm(path, { recursive: false, force: false });
    }

    await this.internalExecute({
      connection: connection,
      args: [path],
      command: `rm`,
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
      console.warn('[PodmanService] provider do not have a VMType, considering native podman linux.');
      console.debug(`[PodmanService] command ${command} args ${args}`);
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

  spawn(options: {
    connection: ProviderContainerConnection;
    command: string;
    args: string[];
    signal?: AbortSignal;
  }): ChildProcess {
    if (options.connection.connection.vmType !== undefined) {
      throw new Error('[PodmanService] non-native connection are not supported');
    }

    let args = options.args;
    let command = options.command;
    if (env['FLATPAK_ID'] !== undefined) {
      args = ['--host', options.command, ...(args ?? [])];
      command = 'flatpak-spawn';
    }

    const process = spawn(command, args, {
      detached: true,
      signal: options.signal,
      env: {
        SYSTEMD_COLORS: 'true',
      },
    });

    // handle exit close
    process.on('error', console.error);
    process.on('exit', console.log.bind(console, `${process.pid} exited`));
    process.on('close', console.log.bind(console, `${process.pid} closed`));

    this.#disposables.push(
      Disposable.create(() => {
        if (!process.killed || !process.exitCode || process.connected) {
          console.warn(`killing process (${options.command})`);
          process.kill();
        }
      }),
    );

    return process;
  }

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
    this.#extensionsEventDisposable?.dispose();
  }
}
