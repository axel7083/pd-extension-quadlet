/**
 * @author axel7083
 */
import type { env, provider as Provider, Webview } from '@podman-desktop/api';
import { Publisher } from '../utils/publisher';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import { Messages } from '/@shared/src/messages';
import type { PodmanService } from './podman-service';
import type { SystemdService } from './systemd-service';

export interface QuadletServiceDependencies {
  providers: typeof Provider;
  env: typeof env;
  webview: Webview;
  podman: PodmanService;
  systemd: SystemdService;
}

export abstract class QuadletHelper extends Publisher<QuadletInfo[]> {
  protected constructor(protected dependencies: QuadletServiceDependencies) {
    super(dependencies.webview, Messages.UPDATE_QUADLETS, () => this.all());
  }

  abstract all(): QuadletInfo[];

  protected get providers(): typeof Provider {
    return this.dependencies.providers;
  }

  protected get podman(): PodmanService {
    return this.dependencies.podman;
  }
}
