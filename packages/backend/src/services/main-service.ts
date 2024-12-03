/**
 * @author axel7083
 */
import type {
  Disposable,
  env,
  ExtensionContext,
  extensions,
  process as processApi,
  provider,
  window,
} from '@podman-desktop/api';
import { WebviewService } from './webview-service';
import { RpcExtension } from '/@shared/src/messages/MessageProxy';
import { PodmanService } from './podman-service';
import { SystemdService } from './systemd-service';
import { QuadletService } from './quadlet-service';
import { QuadletApiImpl } from '../apis/quadlet-api-impl';
import { QuadletApi } from '/@shared/src/apis/quadlet-api';
import type { AsyncInit } from '../utils/async-init';

interface Dependencies {
  extensionContext: ExtensionContext;
  window: typeof window;
  env: typeof env;
  extensions: typeof extensions;
  processApi: typeof processApi;
  providers: typeof provider;
}

export class MainService implements Disposable, AsyncInit {
  readonly #disposables: Disposable[] = [];

  constructor(private dependencies: Dependencies) {}

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
  }

  async init(): Promise<void> {
    // init webview
    const webview = new WebviewService({
      extensionUri: this.dependencies.extensionContext.extensionUri,
      window: this.dependencies.window,
    });
    await webview.init();
    this.#disposables.push(webview);

    // init IPC system
    const rpcExtension = new RpcExtension(webview.getPanel().webview);
    rpcExtension.init();
    this.#disposables.push(rpcExtension);

    // The Podman Service is responsible for communicating with the podman extension
    const podman = new PodmanService({
      env: this.dependencies.env,
      extensions: this.dependencies.extensions,
      processApi: this.dependencies.processApi,
      providers: this.dependencies.providers,
    });
    await podman.init();
    this.#disposables.push(podman);

    // systemd service is responsible for communicating with the systemd in the podman machine
    const systemd = new SystemdService({
      podman,
    });
    await systemd.init();
    this.#disposables.push(systemd);

    // quadlet service is responsible for interacting with the Quadlet CLI
    const quadletService = new QuadletService({
      systemd,
      podman,
      webview: webview.getPanel().webview,
      env: this.dependencies.env,
      providers: this.dependencies.providers,
    });
    await quadletService.init();
    this.#disposables.push(quadletService);

    // registering the api for the frontend IPCs
    const quadletApiImpl = new QuadletApiImpl({
      quadlet: quadletService,
      systemd: systemd,
      podman: podman,
    });
    rpcExtension.registerInstance<QuadletApi>(QuadletApi, quadletApiImpl);
  }
}
