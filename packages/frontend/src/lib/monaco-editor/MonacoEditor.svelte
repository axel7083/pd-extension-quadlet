<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import './monaco';
import type { HTMLAttributes } from 'svelte/elements';

interface Props extends HTMLAttributes<HTMLElement> {
  content: string;
  language: string;
  readOnly?: boolean;
}

let { content = $bindable(), language, readOnly = false, class: className, ...restProps }: Props = $props();

// solution from https://github.com/vitejs/vite/discussions/1791#discussioncomment-9281911

let editor: Monaco.editor.IStandaloneCodeEditor;
let editorContainer: HTMLElement;

onMount(async () => {
  import('monaco-editor/esm/vs/editor/editor.api').then(monaco => {
    editor = monaco.editor.create(editorContainer, {
      value: content,
      language: language,
      automaticLayout: true,
      readOnly: readOnly,
    });

    editor.onDidChangeModelContent(() => {
      content = editor.getValue();
    });
  });
});

onDestroy(() => {
  editor?.dispose();
});
</script>

<div class="h-full w-full {className}" {...restProps} bind:this={editorContainer}></div>
