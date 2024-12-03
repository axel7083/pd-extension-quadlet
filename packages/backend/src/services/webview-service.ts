/**
 * @author axel7083
 */
import { Uri } from '@podman-desktop/api';
import type { Disposable, WebviewOptions, WebviewPanel, window } from '@podman-desktop/api';
import { promises } from 'node:fs';
import type { AsyncInit } from '../utils/async-init';

interface Dependencies {
  extensionUri: Uri;
  window: typeof window;
}

export class WebviewService implements Disposable, AsyncInit {
  readonly #mediaPath: Uri;
  #panel: WebviewPanel | undefined;

  constructor(protected dependencies: Dependencies) {
    this.#mediaPath = Uri.joinPath(this.dependencies.extensionUri, 'media');
  }

  getPanel(): WebviewPanel {
    if (!this.#panel) throw new Error('webview panel is not initialized.');
    return this.#panel;
  }

  async init(): Promise<void> {
    // register webview
    const panel = this.dependencies.window.createWebviewPanel('quadlet', 'Podman Quadlet', this.getWebviewOptions());

    // update html
    const indexHtmlUri = Uri.joinPath(this.#mediaPath, 'index.html');
    const indexHtmlPath = indexHtmlUri.fsPath;

    let indexHtml = await promises.readFile(indexHtmlPath, 'utf8');

    // replace links with webView Uri links
    // in the content <script type="module" crossorigin src="./index-RKnfBG18.js"></script> replace src with webview.asWebviewUri
    const scriptLink = indexHtml.match(/<script.*?src="(.*?)".*?>/g);
    if (scriptLink) {
      scriptLink.forEach(link => {
        const src = RegExp(/src="(.*?)"/).exec(link);
        if (src) {
          const webviewSrc = panel.webview.asWebviewUri(Uri.joinPath(this.#mediaPath, src[1]));
          if (!webviewSrc) throw new Error('undefined webviewSrc');
          indexHtml = indexHtml.replace(src[1], webviewSrc.toString());
        }
      });
    }

    // and now replace for css file as well
    const cssLink = indexHtml.match(/<link.*?href="(.*?)".*?>/g);
    if (cssLink) {
      cssLink.forEach(link => {
        const href = RegExp(/href="(.*?)"/).exec(link);
        if (href) {
          const webviewHref = panel.webview.asWebviewUri(Uri.joinPath(this.#mediaPath, href[1]));
          if (!webviewHref)
            throw new Error('Something went wrong while replacing links with webView Uri links: undefined webviewHref');
          indexHtml = indexHtml.replace(href[1], webviewHref.toString());
        }
      });
    }

    panel.webview.html = indexHtml;
    this.#panel = panel;
  }

  protected getWebviewOptions(): WebviewOptions {
    return {
      // Enable javascript in the webview
      // enableScripts: true,

      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [Uri.joinPath(this.#mediaPath)],
    };
  }

  dispose(): void {
    this.#panel?.dispose();
    this.#panel = undefined;
  }
}
