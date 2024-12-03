<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import './monaco';

interface Props {
  content: string;
  language: string;
  readOnly?: boolean;
}

let { content, language, readOnly = false }: Props = $props();

// solution from https://github.com/vitejs/vite/discussions/1791#discussioncomment-9281911

let editor: Monaco.editor.IStandaloneCodeEditor;
let editorContainer: HTMLElement;

onMount(async () => {
  console.log('trying to import');
  import("monaco-editor/esm/vs/editor/editor.api").then((monaco) => {
    editor = monaco.editor.create(editorContainer, {
      value: content,
      language: language,
      automaticLayout: true,
      readOnly: readOnly,
    });
  });
});

onDestroy(() => {
  editor?.dispose();
});
</script>

<div class="h-full w-screen" bind:this={editorContainer} ></div>
