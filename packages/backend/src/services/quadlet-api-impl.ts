/**
 * @author axel7083
 */

import type { QuadletApi } from '/@shared/src/apis/quadlet-api';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import type { QuadletService } from './quadlet-service';
import type { ProviderContainerConnectionInfo } from '/@shared/src/apis/provider-container-connection-info';
import type { SystemdService } from './systemd-service';
import type { PodmanService } from './podman-service';

interface Dependencies {
  quadlet: QuadletService;
  systemd: SystemdService;
  podman: PodmanService;
}

export class QuadletApiImpl implements QuadletApi {
  constructor(protected dependencies: Dependencies) {}

  async all(): Promise<QuadletInfo[]> {
    return this.dependencies.quadlet.all();
  }

  async refresh(): Promise<void> {
    return this.dependencies.quadlet.collectPodmanQuadlet();
  }

  async start(connection: ProviderContainerConnectionInfo, id: string): Promise<boolean> {
    const providerConnection = this.dependencies.podman.getProviderContainerConnection(connection);
    try {
      return await this.dependencies.systemd.start({
        service: id,
        provider: providerConnection,
        admin: false,
      });
    } finally {
      this.dependencies.quadlet.refreshQuadletsStatuses().catch(console.error);
    }
  }

  async stop(connection: ProviderContainerConnectionInfo, id: string): Promise<boolean> {
    const providerConnection = this.dependencies.podman.getProviderContainerConnection(connection);
    try {
      return await this.dependencies.systemd.stop({
        service: id,
        provider: providerConnection,
        admin: false,
      });
    } finally {
      this.dependencies.quadlet.refreshQuadletsStatuses().catch(console.error);
    }
  }
}
