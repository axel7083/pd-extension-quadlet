/**
 * @author axel7083
 */
import type { AsyncInit } from '../utils/async-init';
import type { Disposable, WebviewPanel } from '@podman-desktop/api';
import { Publisher } from '../utils/publisher';
import { Messages } from '/@shared/src/messages';
import type { ProviderContainerConnectionIdentifierInfo } from '/@shared/src/models/provider-container-connection-identifier-info';

interface Dependencies {
  panel: WebviewPanel;
}

export class RoutingService extends Publisher<string | undefined> implements Disposable, AsyncInit {
  #route: string | undefined = undefined;

  constructor(protected dependencies: Dependencies) {
    super(dependencies.panel.webview, Messages.ROUTE_UPDATE, () => this.#route);
  }

  async init(): Promise<void> {}

  /**
   * This function return the route, and reset it.
   * Meaning after read the route is undefined
   */
  public read(): string | undefined {
    const result: string | undefined = this.#route;
    this.#route = undefined;
    return result;
  }

  protected async write(route: string): Promise<void> {
    // update the route
    this.#route = route;
    // notify
    this.notify();
    // reveal
    this.dependencies.panel.reveal();
  }

  async openQuadletCreate(provider: ProviderContainerConnectionIdentifierInfo, containerId: string): Promise<void> {
    return this.write(
      `/quadlets/create?providerId=${provider.providerId}&connection=${provider.name}&containerId=${containerId}`,
    );
  }

  dispose(): void {
    this.#route = undefined;
  }
}
