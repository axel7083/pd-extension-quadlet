/**
 * @author axel7083
 */
import type { PodmanService } from './podman-service';

export interface SystemdServiceDependencies {
  podman: PodmanService;
}

export abstract class SystemdHelper {
  protected constructor(protected dependencies: SystemdServiceDependencies) {}

  protected get podman(): PodmanService {
    return this.dependencies.podman;
  }
}
