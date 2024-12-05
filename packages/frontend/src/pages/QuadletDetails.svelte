<script lang="ts">
// import MonacoEditor from '/@/lib/monaco-editor/MonacoEditor.svelte';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import { quadletsInfo } from '/@store/quadlets';
import { DetailsPage, Tab } from '@podman-desktop/ui-svelte';
import { router } from 'tinro';
import Fa from 'svelte-fa';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import Route from '/@/lib/Route.svelte';
import { onMount } from 'svelte';
import { quadletAPI } from '/@/api/client';
import ProgressBar from '/@/lib/progress/ProgressBar.svelte';

interface Props {
  id: string;
  providerId: string;
  connection: string;
}

let { id, providerId, connection }: Props = $props();

let loading: boolean = $state(true);
let quadletSource: string | undefined = $state(undefined);

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

onMount(async () => {
  try {
    quadletSource = await quadletAPI.read(
      {
        name: connection,
        providerId: providerId,
      },
      id,
    );
  } catch (err: unknown) {
    console.error(err);
  } finally {
    loading = false;
  }
});
</script>

{#if quadlet}
  <DetailsPage
    title={quadlet.id}
    onclose={close}
    breadcrumbLeftPart="Quadlets"
    breadcrumbRightPart={quadlet.id}
    breadcrumbTitle="Go back to quadlets page"
    onbreadcrumbClick={close}>
    <svelte:fragment slot="tabs">
      <!-- generated tab -->
      <Tab
        title="Generated"
        url="/quadlets/{providerId}/{connection}/{id}"
        selected={$router.path === `/quadlets/${providerId}/${connection}/${id}`} />
      <!-- source tab -->
      <Tab
        title="Source"
        url="/quadlets/{providerId}/{connection}/{id}/source"
        selected={$router.path === `/quadlets/${providerId}/${connection}/${id}/source`} />
    </svelte:fragment>
    <svelte:fragment slot="icon">
      <div class="rounded-full w-8 h-8 flex items-center justify-center">
        <Fa size="1.125x" class="text-[var(--pd-content-header-icon)]" icon={faMagnifyingGlass} />
      </div>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="flex flex-col w-full">
        <!-- loading indicator -->
        <div class="h-0.5">
          <!-- avoid flickering -->
          {#if loading}
            <ProgressBar class="w-full h-0.5" width="w-full" height="h-0.5" />
          {/if}
        </div>

        <!-- quadlet -dryrun output -->
        <Route path="/">
          <!-- monaco editor is multiplying the build time by too much -->
          <!-- <MonacoEditor readOnly content={quadlet.content} language="ini" /> -->
          <code class="whitespace-break-spaces text-sm">{quadlet.content}</code>
        </Route>

        <!-- content of the path -->
        <Route path="/source">
          <span>{quadlet.path}</span>
          <code class="whitespace-break-spaces text-sm">{quadletSource}</code>
        </Route>
      </div>
    </svelte:fragment>
  </DetailsPage>
{/if}
