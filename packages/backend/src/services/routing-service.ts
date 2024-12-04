/**
 * @author axel7083
 */
import type { AsyncInit } from '../utils/async-init';
import type { Disposable, WebviewPanel } from '@podman-desktop/api';
import { Publisher } from '../utils/publisher';
import { Messages } from '/@shared/src/messages';

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

  async openQuadletCreate(): Promise<void> {
    return this.write('/quadlets/create');
  }

  dispose(): void {
    this.#route = undefined;
  }
}
