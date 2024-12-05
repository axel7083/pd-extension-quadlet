<script lang="ts">
import { FormPage, EmptyScreen } from '@podman-desktop/ui-svelte';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';
import { onMount } from 'svelte';
import { podletAPI } from '/@/api/client';
import ProgressBar from '/@/lib/progress/ProgressBar.svelte';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import PodletInstall from '/@/lib/buttons/PodletInstall.svelte';
import { router } from 'tinro';
import QuadletForm from '/@/lib/forms/quadlet/QuadletForm.svelte';

export interface QuadletCreateFormProps {
  providerId?: string;
  connection?: string;
  resourceId?: string;
  quadletType?: string;
}

// We get the query parameters from the parent
let props: QuadletCreateFormProps = $props();

let loading: boolean = $state(false);
let podletInstalled: boolean | undefined = $state(undefined);

async function checkPodletInstallation(): Promise<void> {
  podletInstalled = await podletAPI.isInstalled();
}

function close(): void {
  router.goto('/');
}

onMount(async () => {
  await checkPodletInstallation();
});
</script>

<FormPage
  title="Create Quadlet"
  onclose={close}
  breadcrumbLeftPart="Quadlets"
  breadcrumbRightPart="Create"
  breadcrumbTitle="Go back to quadlets page"
  onbreadcrumbClick={close}>
  <svelte:fragment slot="icon">
    <div class="rounded-full w-8 h-8 flex items-center justify-center">
      <Fa size="1.125x" class="text-[var(--pd-content-header-icon)]" icon={faPlusCircle} />
    </div>
  </svelte:fragment>
  <svelte:fragment slot="content">
    <div class="flex flex-col w-full">
      <!-- loading indicator -->
      <div class="h-0.5">
        <!-- avoid flickering -->
        {#if loading || podletInstalled === undefined}
          <ProgressBar class="w-full h-0.5" width="w-full" height="h-0.5" />
        {/if}
      </div>

      {#if podletInstalled === false}
        <EmptyScreen
          icon={faWarning}
          title="Podlet is not installed"
          message="Podlet is used to generate Podman Quadlet files from a Podman command, compose file, or existing object">
          <PodletInstall bind:loading={loading} onInstallCompleted={checkPodletInstallation} />
        </EmptyScreen>
      {:else if podletInstalled}
        <QuadletForm {...props} bind:loading={loading} />
      {/if}
    </div>
  </svelte:fragment>
</FormPage>
