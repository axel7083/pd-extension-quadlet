/**
 * @author axel7083
 */
import type { Disposable, ProviderContainerConnection } from '@podman-desktop/api';
import type { SystemdServiceDependencies } from './systemd-helper';
import { SystemdHelper } from './systemd-helper';
import type { AsyncInit } from '../utils/async-init';
import { TelemetryEvents } from '../utils/telemetry-events';

export class SystemdService extends SystemdHelper implements Disposable, AsyncInit {
  constructor(dependencies: SystemdServiceDependencies) {
    super(dependencies);
  }

  async init(): Promise<void> {}

  async getSystemctlVersion(provider: ProviderContainerConnection): Promise<string> {
    const result = await this.podman.systemctlExec({
      connection: provider,
      args: ['--version'],
    });
    return result.stdout;
  }

  /**
   * @remarks this list may contain systemd units that are not generated by podman, post filtering is needed
   * @protected
   */
  protected async listGeneratedUnitFiles(options: {
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin: boolean;
  }): Promise<string[]> {
    // systemctl --user list-unit-files --state=generated --output=json
    const args: string[] = [];
    if (!options.admin) {
      args.push('--user');
    }
    args.push(...['list-unit-files', '--state=generated', '--output=json']);

    const result = await this.podman.systemctlExec({
      connection: options.provider,
      args: args,
    });

    /**
     * Here is an example of the output of the command
     * [
     * {"unit_file":"nginx.service","state":"generated","preset":null},
     * {"unit_file":"nginx2.service","state":"generated","preset":null}
     * ]
     */
    const parsed = JSON.parse(result.stdout);
    if (!Array.isArray(parsed)) throw new Error('invalid stdout from systemctl list-unit-files');

    return parsed.map((raw: unknown) => {
      if (!raw || typeof raw !== 'object' || !('unit_file' in raw) || typeof raw['unit_file'] !== 'string')
        throw new Error('malformed unit file json content');
      return raw['unit_file'];
    });
  }

  async getActiveStatus(options: {
    provider: ProviderContainerConnection;
    services: string[];
    /**
     * @default false (Run as systemd user)
     */
    admin: boolean;
  }): Promise<Record<string, boolean>> {
    // shortcut if length is 0
    if (options.services.length === 0) return {};

    const args: string[] = [];
    if (!options.admin) {
      args.push('--user');
    }
    args.push(...['is-active', '--output=json']);
    args.push(...options.services);

    console.log(`[SystemdService] running ${args}`);
    const result = await this.podman.systemctlExec({
      connection: options.provider,
      args,
    });
    const lines: string[] = result.stdout.split('\n');

    if (lines.length !== options.services.length)
      throw new Error(
        `Something went wrong while getting is-active of services, required the state of ${options.services.length} services got ${lines.length} values.`,
      );

    return Object.fromEntries(lines.map((line, index) => [options.services[index], line === 'active']));
  }

  dispose(): void {}

  /**
   * This method will run `systemctl daemon-reload`
   * @param options
   */
  public async daemonReload(options: {
    provider: ProviderContainerConnection;
    /**
     * @default false (Run as systemd user)
     */
    admin: boolean;
  }): Promise<boolean> {
    const args: string[] = [];
    if (!options.admin) {
      args.push('--user');
    }
    args.push('daemon-reload');
    const result = await this.podman.systemctlExec({
      connection: options.provider,
      args,
    });
    return result.stderr.length === 0;
  }

  async start(options: {
    provider: ProviderContainerConnection;
    service: string;
    /**
     * @default false (Run as systemd user)
     */
    admin: boolean;
  }): Promise<boolean> {
    const telemetry: Record<string, unknown> = {
      admin: options.admin,
    };

    try {
      const args: string[] = [];
      if (!options.admin) {
        args.push('--user');
      }
      args.push(...['start', options.service]);

      const result = await this.podman.systemctlExec({
        connection: options.provider,
        args,
      });
      return result.stderr.length === 0;
    } catch (err: unknown) {
      telemetry['error'] = err;
      throw err;
    } finally {
      this.logUsage(TelemetryEvents.SYSTEMD_START, telemetry);
    }
  }

  async stop(options: {
    provider: ProviderContainerConnection;
    service: string;
    /**
     * @default false (Run as systemd user)
     */
    admin: boolean;
  }): Promise<boolean> {
    const telemetry: Record<string, unknown> = {
      admin: options.admin,
    };

    try {
      const args: string[] = [];
      if (!options.admin) {
        args.push('--user');
      }
      args.push(...['stop', options.service]);

      const result = await this.podman.systemctlExec({
        connection: options.provider,
        args,
      });
      return result.stderr.length === 0;
    } catch (err: unknown) {
      telemetry['error'] = err;
      throw err;
    } finally {
      this.logUsage(TelemetryEvents.SYSTEMD_STOP, telemetry);
    }
  }
}
