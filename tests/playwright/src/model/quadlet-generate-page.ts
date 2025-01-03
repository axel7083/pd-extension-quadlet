import type { Locator, Page } from '@playwright/test';
import { expect as playExpect } from '@playwright/test';
import { QuadletBasePage } from './quadlet-base-page';

export class QuadletGeneratePage extends QuadletBasePage {
  readonly generateButton: Locator;
  readonly cancelButton: Locator;
  readonly containerEngineSelect: Locator;
  readonly containerSelect: Locator;

  constructor(page: Page, webview: Page) {
    super(page, webview, 'Generate Quadlet');

    this.generateButton = this.webview.getByRole('button', { name: 'Generate' });
    this.cancelButton = this.webview.getByRole('button', { name: 'cancel' });

    this.containerEngineSelect = this.webview.getByLabel('Select Container Engine', { exact: true });
    this.containerSelect = this.webview.getByLabel('Select Container', { exact: true });
  }

  waitForLoad(): Promise<void> {
    return playExpect(this.heading).toBeVisible();
  }
}
