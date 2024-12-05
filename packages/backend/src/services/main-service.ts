/**
 * @author axel7083
 */
import type {
  Disposable,
  env,
  ExtensionContext,
  extensions,
  process as processApi,
  commands as commandsApi,
  provider,
  window,
  cli as cliApi,
  containerEngine,
} from '@podman-desktop/api';
import { WebviewService } from './webview-service';
import { RpcExtension } from '/@shared/src/messages/MessageProxy';
import { PodmanService } from './podman-service';
import { SystemdService } from './systemd-service';
import { QuadletService } from './quadlet-service';
import { QuadletApiImpl } from '../apis/quadlet-api-impl';
import { QuadletApi } from '/@shared/src/apis/quadlet-api';
import type { AsyncInit } from '../utils/async-init';
import { ProviderApiImpl } from '../apis/provider-api-impl';
import { ProviderApi } from '/@shared/src/apis/provide-api';
import { ProviderService } from './provider-service';
import { PodletCliService } from './podlet-cli-service';
import { Octokit } from '@octokit/rest';
import { CommandService } from './command-service';
import { RoutingService } from './routing-service';
import { RoutingApiImpl } from '../apis/routing-api-impl';
import { RoutingApi } from '/@shared/src/apis/routing-api';
import { ContainerService } from './container-service';
import { ContainerApiImpl } from '../apis/container-api-impl';
import { ContainerApi } from '/@shared/src/apis/container-api';
import { PodletApiImpl } from '../apis/podlet-api-impl';
import { PodletApi } from '/@shared/src/apis/podlet-api';

interface Dependencies {
  extensionContext: ExtensionContext;
  window: typeof window;
  env: typeof env;
  extensions: typeof extensions;
  processApi: typeof processApi;
  providers: typeof provider;
  cliApi: typeof cliApi;
  commandsApi: typeof commandsApi;
  containers: typeof containerEngine;
}

export class MainService implements Disposable, AsyncInit {
  readonly #disposables: Disposable[] = [];

  constructor(private dependencies: Dependencies) {}

  dispose(): void {
    this.#disposables.forEach(disposable => disposable.dispose());
  }

  async init(): Promise<void> {
    /**
     * Creating and init Services
     */
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

    // routing service
    const routing = new RoutingService({
      panel: webview.getPanel(),
    });
    await routing.init();
    this.#disposables.push(routing);

    // Responsible for managing the Podlet cli tool
    const podletCli = new PodletCliService({
      cliApi: this.dependencies.cliApi,
      env: this.dependencies.env,
      window: this.dependencies.window,
      processApi: this.dependencies.processApi,
      storagePath: this.dependencies.extensionContext.storagePath,
      octokit: new Octokit(),
    });
    await podletCli.init();
    this.#disposables.push(podletCli);

    // The provider service register subscribers events for provider updates
    const providers = new ProviderService({
      providers: this.dependencies.providers,
      webview: webview.getPanel().webview,
    });
    await providers.init();
    this.#disposables.push(providers);

    // The Podman Service is responsible for communicating with the podman extension
    const podman = new PodmanService({
      env: this.dependencies.env,
      extensions: this.dependencies.extensions,
      processApi: this.dependencies.processApi,
      providers: providers,
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
      window: this.dependencies.window,
    });
    await quadletService.init();
    this.#disposables.push(quadletService);

    // Basic manipulate of containers
    const containers = new ContainerService({
      containers: this.dependencies.containers,
      providers: providers,
    });
    await containers.init();
    this.#disposables.push(containers);

    // Register/execute commands
    const command = new CommandService({
      commandsApi: this.dependencies.commandsApi,
      routing: routing,
      providers: providers,
      containers: containers,
    });
    await command.init();
    this.#disposables.push(command);

    /**
     * Creating the api for the frontend IPCs
     */

    // quadlet api
    const quadletApiImpl = new QuadletApiImpl({
      quadlet: quadletService,
      systemd: systemd,
      podman: podman,
      providers: providers,
    });
    rpcExtension.registerInstance<QuadletApi>(QuadletApi, quadletApiImpl);

    // provider api
    const providerApiImpl = new ProviderApiImpl({
      podman: podman,
      providers: providers,
    });
    rpcExtension.registerInstance<ProviderApi>(ProviderApi, providerApiImpl);

    // container api
    const containerApiImpl = new ContainerApiImpl({
      containers: containers,
    });
    rpcExtension.registerInstance<ContainerApi>(ContainerApi, containerApiImpl);

    // podlet api
    const podletApiImpl = new PodletApiImpl({
      podlet: podletCli,
    });
    rpcExtension.registerInstance<PodletApi>(PodletApi, podletApiImpl);

    // routing api
    const routingApiImpl = new RoutingApiImpl({
      routing: routing,
    });
    rpcExtension.registerInstance<RoutingApi>(RoutingApi, routingApiImpl);
  }
}
