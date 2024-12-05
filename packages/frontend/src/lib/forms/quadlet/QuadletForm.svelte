<script lang="ts">
import { faTruckRampBox } from '@fortawesome/free-solid-svg-icons/faTruckRampBox';
import ContainerProviderConnectionSelect from '/@/lib/select/ContainerProviderConnectionSelect.svelte';
import { Button } from '@podman-desktop/ui-svelte';
import type { Component } from 'svelte';
import { QUADLET_FORMS, type QuadletChildrenFormProps, RESOURCE_ID_QUERY } from '/@/lib/forms/quadlet/quadlet-utils';
import { QuadletType } from '/@shared/src/utils/quadlet-type';
import type { QuadletCreateFormProps } from '/@/pages/QuadletCreate.svelte';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';
import { providerConnectionsInfo } from '/@store/connections';
import { router } from 'tinro';
import RadioButtons from '/@/lib/buttons/RadioButtons.svelte';
import { ErrorMessage } from '@podman-desktop/ui-svelte';
import { quadletAPI } from '/@/api/client';

interface Props extends QuadletCreateFormProps {
  loading: boolean;
}

let {
  loading = $bindable(),
  quadletType = QuadletType.CONTAINER, // default to container
  providerId,
  connection,
  resourceId,
}: Props = $props();
let ChildForm: Component<QuadletChildrenFormProps> = $derived(QUADLET_FORMS[quadletType as QuadletType]);

// using the query parameters
let selectedContainerProviderConnection: ProviderContainerConnectionDetailedInfo | undefined = $derived(
  $providerConnectionsInfo.find(provider => provider.providerId === providerId && provider.name === connection),
);

function onQuadletTypeChange(value: string): void {
  router.location.query.set('quadletType', value);
  router.location.query.delete(RESOURCE_ID_QUERY); // delete the key
  // reset
  error = undefined;
  quadlet = undefined;
}

function onContainerProviderConnectionChange(value: ProviderContainerConnectionDetailedInfo | undefined): void {
  if (value) {
    router.location.query.set('providerId', value.providerId);
    router.location.query.set('connection', value.name);
    router.location.query.delete(RESOURCE_ID_QUERY); // delete the key
  } else {
    router.location.query.clear();
  }
  // reset
  error = undefined;
  quadlet = undefined;
}

// reset quadlet if any got cleared
$effect(() => {
  if (!providerId || !resourceId || !quadletType) {
    quadlet = undefined;
    error = undefined;
  }
});

let quadlet: string | undefined = $state(undefined);
function onGenerate(value: string): void {
  error = undefined;
  quadlet = value;
}

let error: Error | undefined = $state();
function onError(err: Error): void {
  quadlet = undefined;
  error = err;
}

async function saveIntoMachine(): Promise<void> {
  if (!selectedContainerProviderConnection) throw new Error('no container provider connection selected');
  if (!quadlet) throw new Error('generation invalid');

  loading = true;
  try {
    await quadletAPI.saveIntoMachine({
      connection: $state.snapshot(selectedContainerProviderConnection),
      name: 'dummy.container',
      quadlet: quadlet,
    });
    router.goto('/');
  } catch (err: unknown) {
    onError(new Error(`Something went wrong while adding quadlet to machine: ${String(err)}`));
  } finally {
    loading = false;
  }
}
</script>

<!-- form -->
<div class="bg-[var(--pd-content-card-bg)] m-5 space-y-6 px-8 sm:pb-6 xl:pb-8 rounded-lg h-fit">
  <div class="w-full">
    <!-- all forms share the container provider connection selection -->
    <label for="container-engine" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
      >Container engine</label>
    <ContainerProviderConnectionSelect
      disabled={loading}
      onChange={onContainerProviderConnectionChange}
      value={selectedContainerProviderConnection}
      containerProviderConnections={$providerConnectionsInfo} />

    <label for="container-engine" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
      >Quadlet type</label>
    <RadioButtons
      disabled={loading || selectedContainerProviderConnection === undefined}
      onChange={onQuadletTypeChange}
      value={quadletType}
      options={Object.values(QuadletType).map(key => ({
        id: key,
        label: key,
      }))} />

    <!-- each form is individual -->
    <ChildForm
      onError={onError}
      onGenerate={onGenerate}
      bind:loading={loading}
      provider={selectedContainerProviderConnection}
      resourceId={resourceId} />
    {#if error}
      <ErrorMessage error={String(error)} />
    {/if}
  </div>

  <!-- todo replace with monaco -->
  <code class="whitespace-break-spaces text-sm pt-4">
    {quadlet}
  </code>

  <footer>
    <div class="w-full flex flex-row gap-x-2 justify-end">
      <Button
        disabled={!!error || !selectedContainerProviderConnection || !quadlet}
        icon={faTruckRampBox}
        title="Save into podman machine"
        on:click={saveIntoMachine}>Save into podman machine</Button>
    </div>
  </footer>
</div>
