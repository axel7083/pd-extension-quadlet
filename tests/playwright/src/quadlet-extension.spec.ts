import type { ExtensionsPage } from '@podman-desktop/tests-playwright';
import {
  ensureCliInstalled,
  expect as playExpect,
  test,
  RunnerOptions,
  waitForPodmanMachineStartup,
  isLinux,
} from '@podman-desktop/tests-playwright';
import { PdQuadletDetailsPage } from './model/pd-quadlet-details-page';
import { QuadletListPage } from './model/quadlet-list-page';
import { handleWebview } from './utils/webviewHandler';

const PODMAN_QUADLET_EXTENSION_OCI_IMAGE =
  process.env.EXTENSION_OCI_IMAGE ?? 'ghcr.io/axel7083/pd-extension-quadlet:latest';
const PODMAN_QUADLET_EXTENSION_PREINSTALLED: boolean = process.env.EXTENSION_PREINSTALLED === 'true';
const PODMAN_QUADLET_CATALOG_EXTENSION_LABEL: string = 'axel7083.quadlet';
const PODMAN_QUADLET_CATALOG_EXTENSION_NAME: string = 'Podman Quadlet';
const PODMAN_QUADLET_CATALOG_STATUS_ACTIVE: string = 'ACTIVE';
const QUAY_HELLO_IMAGE = 'quay.io/podman/hello';
const HELLO_CONTAINER = 'hello-container';

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
  test.describe.serial(`Podman Quadlet extension installation`, () => {
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
      const extensionCard = await extensions.getInstalledExtension('quadlet', PODMAN_QUADLET_CATALOG_EXTENSION_LABEL);
      await extensionCard.openExtensionDetails(PODMAN_QUADLET_CATALOG_EXTENSION_NAME);
      const details = new PdQuadletDetailsPage(page);
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

  test('Install Podlet CLI', async ({ navigationBar, page }) => {
    const settingsBar = await navigationBar.openSettings();
    await settingsBar.cliToolsTab.click();
    await ensureCliInstalled(page, 'Podlet');
  });

  test.describe.serial('Generate quadlets', () => {
    let quadletListPage: QuadletListPage;

    test.beforeAll('Pull Images & Start Hello Container', async ({ navigationBar }) => {
      // let's pull QUAY_HELLO_IMAGE image
      const imagesPage = await navigationBar.openImages();
      await playExpect(imagesPage.heading).toBeVisible();

      const pullImagePage = await imagesPage.openPullImage();
      const updatedImages = await pullImagePage.pullImage(QUAY_HELLO_IMAGE);

      const exists = await updatedImages.waitForImageExists(QUAY_HELLO_IMAGE);
      playExpect(exists, `${QUAY_HELLO_IMAGE} image not present in the list of images\`).toBeTruthy();`);

      // let's create container from pulled image
      const imageDetails = await imagesPage.openImageDetails(QUAY_HELLO_IMAGE);
      const runImage = await imageDetails.openRunImage();
      const containers = await runImage.startContainer(HELLO_CONTAINER, {
        attachTerminal: false,
      });
      await playExpect(containers.header).toBeVisible();
      await playExpect
        .poll(async () => await containers.containerExists(HELLO_CONTAINER), {
          timeout: 60_000,
        })
        .toBeTruthy();
    });

    test.beforeEach('Open Podman Quadlet webview', async ({ runner, page, navigationBar }) => {
      // open the webview
      const [pdPage, webview] = await handleWebview(runner, page, navigationBar);
      quadletListPage = new QuadletListPage(pdPage, webview);
      // warning: might be a problem if we are already on the webview
      await quadletListPage.waitForLoad();
    });

    test('generate container quadlet', async () => {
      test.setTimeout(150_000);

      const generateForm = await quadletListPage.navigateToGenerateForm();
      await generateForm.waitForLoad();

      await playExpect(generateForm.cancelButton).toBeEnabled();
      await playExpect(generateForm.generateButton).toBeDisabled(); // default should be disabled

      // select container engine
      await generateForm.containerEngineSelect.fill(isLinux ? 'podman' : 'podman-machine-default');
      await generateForm.webview.keyboard.press('Enter');

      // todo: do something better ? trying to wait for loading to finish?
      await new Promise(resolve => setTimeout(resolve, 2_000));

      // select container
      await generateForm.containerSelect.fill(HELLO_CONTAINER);
      await generateForm.webview.keyboard.press('Enter');

      // wait for generateButton to be enabled
      await playExpect
        .poll(async () => await generateForm.generateButton.isEnabled(), {
          timeout: 2_000,
        })
        .toBeTruthy();

      // generate
      await generateForm.generateButton.click();

      const monacoEditor = generateForm.webview.locator('.monaco-editor').nth(0);
      const content = await monacoEditor.textContent();
      playExpect(content).not.toBeNull();
    });

    test.afterAll(`Deleting container ${HELLO_CONTAINER}`, async ({ navigationBar }) => {
      test.setTimeout(150_000);

      const containers = await navigationBar.openContainers();
      const containersPage = await containers.deleteContainer(HELLO_CONTAINER);
      await playExpect(containersPage.heading).toBeVisible();
      await playExpect
        .poll(async () => await containersPage.containerExists(HELLO_CONTAINER), {
          timeout: 30_000,
        })
        .toBeFalsy();
    });
  });
});
