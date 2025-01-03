import type { ExtensionsPage } from '@podman-desktop/tests-playwright';
import {
  expect as playExpect,
  test,
  RunnerOptions,
  waitForPodmanMachineStartup,
} from '@podman-desktop/tests-playwright';
import { PodmanExtensionQuadletDetailsPage } from './model/podman-extension-quadlet-details-page';

const PODMAN_QUADLET_EXTENSION_OCI_IMAGE =
  process.env.EXTENSION_OCI_IMAGE ?? 'ghcr.io/axel7083/pd-extension-quadlet:latest';
const PODMAN_QUADLET_EXTENSION_PREINSTALLED: boolean = process.env.EXTENSION_PREINSTALLED === 'true';
const PODMAN_QUADLET_CATALOG_EXTENSION_LABEL: string = 'axel7083.quadlet';
const PODMAN_QUADLET_CATALOG_EXTENSION_NAME: string = 'Podman Quadlet';
const PODMAN_QUADLET_CATALOG_STATUS_ACTIVE: string = 'ACTIVE';

test.use({
  runnerOptions: new RunnerOptions({
    customFolder: 'pd-extension-quadlet-tests',
  }),
});

test.beforeAll(async ({ runner, welcomePage, page }) => {
  runner.setVideoAndTraceName('podman-quadlet-e2e');
  await welcomePage.handleWelcomePage(true);
  await waitForPodmanMachineStartup(page);
});

test.afterAll(async ({ runner }) => {
  test.setTimeout(120_000);
  await runner.close();
});

test.describe.serial(`Podman Quadlet extension installation and verification`, { tag: '@smoke' }, () => {
  test.describe.serial(`AI Lab extension installation`, () => {
    let extensionsPage: ExtensionsPage;

    test(`Open Settings -> Extensions page`, async ({ navigationBar }) => {
      const dashboardPage = await navigationBar.openDashboard();
      await playExpect(dashboardPage.mainPage).toBeVisible();
      extensionsPage = await navigationBar.openExtensions();
      await playExpect(extensionsPage.header).toBeVisible();
    });

    test(`Install Podman Quadlet extension`, async () => {
      test.skip(PODMAN_QUADLET_EXTENSION_PREINSTALLED, 'Podman Quadlet extension is preinstalled');
      await extensionsPage.installExtensionFromOCIImage(PODMAN_QUADLET_EXTENSION_OCI_IMAGE);
    });

    test('Extension (card) is installed, present and active', async ({ navigationBar }) => {
      const extensions = await navigationBar.openExtensions();
      await playExpect
        .poll(async () => await extensions.extensionIsInstalled(PODMAN_QUADLET_CATALOG_EXTENSION_LABEL), {
          timeout: 30000,
        })
        .toBeTruthy();
      const extensionCard = await extensions.getInstalledExtension(
        PODMAN_QUADLET_CATALOG_EXTENSION_NAME,
        PODMAN_QUADLET_CATALOG_EXTENSION_LABEL,
      );
      await playExpect(extensionCard.status).toHaveText(PODMAN_QUADLET_CATALOG_STATUS_ACTIVE);
    });

    test(`Extension's details show correct status, no error`, async ({ page, navigationBar }) => {
      const extensions = await navigationBar.openExtensions();
      const extensionCard = await extensions.getInstalledExtension('ai-lab', PODMAN_QUADLET_CATALOG_EXTENSION_LABEL);
      await extensionCard.openExtensionDetails(PODMAN_QUADLET_CATALOG_EXTENSION_NAME);
      const details = new PodmanExtensionQuadletDetailsPage(page);
      await playExpect(details.heading).toBeVisible();
      await playExpect(details.status).toHaveText(PODMAN_QUADLET_CATALOG_STATUS_ACTIVE);
      const errorTab = details.tabs.getByRole('button', { name: 'Error' });
      // we would like to propagate the error's stack trace into test failure message
      let stackTrace = '';
      if ((await errorTab.count()) > 0) {
        await details.activateTab('Error');
        stackTrace = await details.errorStackTrace.innerText();
      }
      await playExpect(errorTab, `Error Tab was present with stackTrace: ${stackTrace}`).not.toBeVisible();
    });
  });
});
