import { QuadletApi } from '/@shared/src/apis/quadlet-api';
import { RpcBrowser } from '/@shared/src/messages/MessageProxy';
import { ProviderApi } from '/@shared/src/apis/provide-api';
import { RoutingApi } from '/@shared/src/apis/routing-api';
import { ContainerApi } from '/@shared/src/apis/container-api';
import { PodletApi } from '/@shared/src/apis/podlet-api';
import { ImageApi } from '/@shared/src/apis/image-api';

/**
 * This file is the client side of the API. It is used to communicate with the backend, which allows
 * cross-communication between the frontend and backend through an RPC-like communication.
 *
 */
export interface RouterState {
  url: string;
}
const podmanDesktopApi = acquirePodmanDesktopApi();
export const rpcBrowser: RpcBrowser = new RpcBrowser(window, podmanDesktopApi);
export const quadletAPI: QuadletApi = rpcBrowser.getProxy(QuadletApi);
export const providerAPI: ProviderApi = rpcBrowser.getProxy(ProviderApi);
export const routingAPI: RoutingApi = rpcBrowser.getProxy(RoutingApi);
export const containerAPI: ContainerApi = rpcBrowser.getProxy(ContainerApi);
export const imageAPI: ImageApi = rpcBrowser.getProxy(ImageApi);
export const podletAPI: PodletApi = rpcBrowser.getProxy(PodletApi);

// The below code is used to save the state of the router in the podmanDesktopApi, so
// that we can determine the correct route to display when the extension is reloaded.
export const saveRouterState = (state: RouterState) => {
  podmanDesktopApi.setState(state);
};

const isRouterState = (value: unknown): value is RouterState => {
  return typeof value === 'object' && !!value && 'url' in value;
};

export async function getRouterState(): Promise<RouterState> {
  const route: string | undefined = await routingAPI.readRoute();
  if (route) {
    return {
      url: route,
    };
  }

  const state = podmanDesktopApi.getState();
  if (isRouterState(state)) return state;
  return { url: '/' };
}

/**
 * Making clients available as global properties
 */
Object.defineProperty(window, 'quadletAPI', {
  value: quadletAPI,
});

Object.defineProperty(window, 'providerAPI', {
  value: providerAPI,
});

Object.defineProperty(window, 'routingAPI', {
  value: routingAPI,
});

Object.defineProperty(window, 'containerAPI', {
  value: containerAPI,
});

Object.defineProperty(window, 'podletAPI', {
  value: podletAPI,
});
