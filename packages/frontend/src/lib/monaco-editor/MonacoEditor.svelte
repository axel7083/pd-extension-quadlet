<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Range } from 'monaco-editor';
import './monaco';
import type { HTMLAttributes } from 'svelte/elements';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

interface Glyph {
  regex: string;
  classes: string;
  id: string;
  onclick: (lineContent: string) => void;
}

interface Props extends HTMLAttributes<HTMLElement> {
  content: string;
  language: string;
  readOnly?: boolean;
  glyphs?: Glyph[];
}

let { content = $bindable(), language, readOnly = false, glyphs = [], class: className, ...restProps }: Props = $props();

// solution from https://github.com/vitejs/vite/discussions/1791#discussioncomment-9281911

let editorInstance: Monaco.editor.IStandaloneCodeEditor;
let editorContainer: HTMLElement;
let decorationCollection: Monaco.editor.IEditorDecorationsCollection | undefined;
let callbacks: Map<number, () => void> = new Map();

function getTerminalBg(): string {
  const app = document.getElementById('app');
  if (!app) throw new Error('cannot found app element');
  const style = window.getComputedStyle(app);

  let color = style.getPropertyValue('--pd-terminal-background').trim();

  // convert to 6 char RGB value since some things don't support 3 char format
  if (color?.length < 6) {
    color = color
      .split('')
      .map(c => {
        return c === '#' ? c : c + c;
      })
      .join('');
  }
  return color;
}

function updateDecorations(): void {
  callbacks.clear();
  if (!editorInstance?.getModel() || !glyphs.length) return;

  const model = editorInstance.getModel();
  if(!model) return;

  const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

  const lines = model.getLinesContent();

  glyphs.forEach(({ regex, classes, id, onclick }) => {
    const matcher = new RegExp(regex);
    lines.forEach((lineContent, index) => {
      if (matcher.test(lineContent)) {
        const lineNumber = index + 1; // Line starts at index + 1 in Monaco
        callbacks.set(lineNumber, onclick.bind(undefined, lineContent));

        decorations.push({
          range: new Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            marginClassName: `${classes} ${id}`,
          },
        });
      }
    });
  });

  if (!decorationCollection) {
    console.log('createDecorationsCollection', decorations);
    decorationCollection = editorInstance.createDecorationsCollection(decorations);
  } else {
    decorationCollection.set(decorations);
  }
}

function handleGlyphClick(event: Monaco.editor.IEditorMouseEvent): void {
  console.log('handleGlyphClick', event);
  if (event.target.type === editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
    const lineNumber = event.target.position?.lineNumber;
    if(!lineNumber) return;

    console.log('found lineNumber', lineNumber);

    callbacks.get(lineNumber)?.();
  }
}
onMount(async () => {
  const terminalBg = getTerminalBg();
  const isDarkTheme: boolean = terminalBg === '#000000';

  import('monaco-editor/esm/vs/editor/editor.api')
    .then(monaco => {
      // define custom theme
      monaco.editor.defineTheme('podmanDesktopTheme', {
        base: isDarkTheme ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [{ token: 'custom-color', background: terminalBg }],
        colors: {
          'editor.background': terminalBg,
          // make the --vscode-focusBorder transparent
          focusBorder: '#00000000',
        },
      });

      editorInstance = monaco.editor.create(editorContainer, {
        value: content,
        language: language,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly: readOnly,
        theme: 'podmanDesktopTheme',
        glyphMargin: true, // Enable glyph margin
      });

      editorInstance.onDidChangeModelContent(() => {
        content = editorInstance.getValue();
        updateDecorations();
      });

      // Register mouse down event for glyph clicks
      editorInstance.onMouseDown(handleGlyphClick);

      // Initial decoration setup
      updateDecorations();
    })
    .catch(console.error);
});

onDestroy(() => {
  callbacks.clear();
  decorationCollection?.clear();
  editorInstance?.dispose();
});
</script>

<div class="h-full w-full {className}" {...restProps} bind:this={editorContainer}></div>
