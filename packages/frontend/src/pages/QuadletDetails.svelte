<script lang="ts">
// import MonacoEditor from '/@/lib/monaco-editor/MonacoEditor.svelte';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import { quadletsInfo } from '/@store/quadlets';
import { DetailsPage, FormPage } from '@podman-desktop/ui-svelte';
import { router } from 'tinro';
import Fa from 'svelte-fa';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';

interface Props {
  id: string;
  providerId: string;
  connection: string;
}

let { id, providerId, connection }: Props = $props();

// found matching quadlets
let quadlet: QuadletInfo | undefined = $derived(
  $quadletsInfo.find(
    quadlet =>
      quadlet.id === id && quadlet.connection.name === connection && quadlet.connection.providerId === providerId,
  ),
);

export function close(): void {
  router.goto('/');
}
</script>

{#if quadlet}
  <DetailsPage
    title={quadlet.id}
    onclose={close}
    breadcrumbLeftPart="Quadlets"
    breadcrumbRightPart={quadlet.id}
    breadcrumbTitle="Go back to quadlets page"
    onbreadcrumbClick={close}>
    <svelte:fragment slot="icon">
      <div class="rounded-full w-8 h-8 flex items-center justify-center">
        <Fa size="1.125x" class="text-[var(--pd-content-header-icon)]" icon={faMagnifyingGlass} />
      </div>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <!-- monaco editor is multiplying the build time by too much -->
      <!-- <MonacoEditor readOnly content={quadlet.content} language="ini" /> -->
      <code class="whitespace-break-spaces text-sm">{quadlet.content}</code>
    </svelte:fragment>
  </DetailsPage>
{/if}
