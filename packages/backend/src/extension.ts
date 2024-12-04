/**
 * @author axel7083
 */
import type { ExtensionContext } from '@podman-desktop/api';
import {
  containerEngine,
  extensions,
  provider,
  process as processApi,
  env,
  window,
  cli as cliApi,
  commands as commandsApi,
} from '@podman-desktop/api';
import { MainService } from './services/main-service';

// Initialize the activation of the extension.
export async function activate(extensionContext: ExtensionContext): Promise<void> {
  console.log('starting hello world extension');

  const main = new MainService({
    window: window,
    extensionContext,
    env,
    extensions,
    processApi: processApi,
    providers: provider,
    cliApi: cliApi,
    commandsApi: commandsApi,
    containers: containerEngine,
  });
  return main.init();
}

export async function deactivate(): Promise<void> {
  console.log('stopping hello world extension');
}
