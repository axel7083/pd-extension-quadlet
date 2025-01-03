import type { Locator, Page } from '@playwright/test';
import { expect as playExpect } from '@playwright/test';
import { QuadletBasePage } from './quadlet-base-page';
import { QuadletGeneratePage } from './quadlet-generate-page';

export class QuadletListPage extends QuadletBasePage {
  readonly generateButton: Locator;

  constructor(page: Page, webview: Page) {
    super(page, webview, 'Podman Quadlets');

    this.generateButton = this.webview.getByRole('button', { name: 'Generate Quadlet' });
  }

  async waitForLoad(): Promise<void> {
    await playExpect(this.heading).toBeVisible();
  }

  async navigateToGenerateForm(): Promise<QuadletGeneratePage> {
    await playExpect(this.generateButton).toBeEnabled();
    await this.generateButton.click();
    return new QuadletGeneratePage(this.page, this.webview);
  }
}
