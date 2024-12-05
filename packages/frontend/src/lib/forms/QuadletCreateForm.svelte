<script lang="ts">
import type { SimpleContainerInfo } from '/@shared/src/models/simple-container-info';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';
import { router } from 'tinro';
import { containerAPI, podletAPI, quadletAPI } from '/@/api/client';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons/faFloppyDisk';
import { faTruckRampBox } from '@fortawesome/free-solid-svg-icons/faTruckRampBox';
import ContainerProviderConnectionSelect from '/@/lib/select/ContainerProviderConnectionSelect.svelte';
import { Button } from '@podman-desktop/ui-svelte';
import ContainersSelect from '/@/lib/select/ContainersSelect.svelte';
import { providerConnectionsInfo } from '/@store/connections';
import type { QuadletCreateFormProps } from '/@/pages/QuadletCreate.svelte';
import RadioButtons from '/@/lib/buttons/RadioButtons.svelte';
import { QuadletType } from '/@shared/src/utils/quadlet-type';

interface Props extends QuadletCreateFormProps {
  loading: boolean;
}

// We get the query parameters from the parent
let { providerId, connection, containerId, loading = $bindable() }: Props = $props();

let containers: SimpleContainerInfo[] = $state([]);
let quadlet: string | undefined = $state(undefined);
let generated: boolean = $derived((quadlet ?? '').length > 0);
let error: string | undefined = $state(undefined);
let quadletType: QuadletType = $state(QuadletType.CONTAINER);

// using the query parameters
let selectedContainerProviderConnection: ProviderContainerConnectionDetailedInfo | undefined = $derived(
  $providerConnectionsInfo.find(provider => provider.providerId === providerId && provider.name === connection),
);
// use the query parameter containerId
let selectedContainer: SimpleContainerInfo | undefined = $derived(
  containers?.find(container => container.id === containerId),
);

async function listContainers(): Promise<void> {
  if (!selectedContainerProviderConnection) throw new Error('no container provider connection selected');
  loading = true;
  // reset
  containers = [];

  try {
    containers = await containerAPI.all($state.snapshot(selectedContainerProviderConnection));
  } catch (err: unknown) {
    console.error(err);
  } finally {
    loading = false;
  }
}

function onContainerProviderConnectionChange(value: ProviderContainerConnectionDetailedInfo | undefined): void {
  if (value) {
    router.location.query.set('providerId', value.providerId);
    router.location.query.set('connection', value.name);
    router.location.query.delete('containerId'); // delete the key
  } else {
    router.location.query.clear();
  }
  // update the list of containers
  quadlet = undefined;
  if (selectedContainerProviderConnection) listContainers().catch(console.error);
}

function onContainerChange(value: SimpleContainerInfo | undefined): void {
  if (value) {
    router.location.query.set('containerId', value.id);
  } else {
    quadlet = undefined;
    router.location.query.delete('containerId'); // delete the key
  }
}

function onQuadletTypeChange(value: string): void {
  quadletType = value as QuadletType;
}

// if we mount the component, and query parameters with all the values defined
// we need to fetch manually the containers
$effect(() => {
  if (
    selectedContainerProviderConnection &&
    !selectedContainer &&
    containers.length === 0 &&
    containerId &&
    loading === false
  ) {
    listContainers().catch(console.error);
  }
});

$effect(() => {
  if (!selectedContainerProviderConnection || !selectedContainer) return;

  loading = true;
  quadlet = undefined;

  podletAPI
    .generateContainer($state.snapshot(selectedContainer))
    .then(result => {
      quadlet = result;
    })
    .catch(console.error)
    .finally(() => {
      loading = false;
    });
});

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
    error = String(err);
    console.error(err);
  } finally {
    loading = false;
  }
}
</script>

<!-- form -->
<div class="bg-[var(--pd-content-card-bg)] m-5 space-y-6 px-8 sm:pb-6 xl:pb-8 rounded-lg h-fit">
  <div class="w-full">
    <label for="container-engine" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
      >Container engine</label>
    <ContainerProviderConnectionSelect
      disabled={loading}
      onChange={onContainerProviderConnectionChange}
      value={selectedContainerProviderConnection}
      containerProviderConnections={$providerConnectionsInfo} />

    <!-- <label for="container-engine" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]"
    >Quadlet type</label>
    <RadioButtons onChange={onQuadletTypeChange} value={quadletType} options={Object.values(QuadletType).map((key) => ({
    id: key,
    label: key
    }))}/> -->

    <!-- container list -->
    <label for="container" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]">Container</label>
    <ContainersSelect
      disabled={loading || selectedContainerProviderConnection === undefined}
      onChange={onContainerChange}
      value={selectedContainer}
      containers={containers} />
  </div>

  <!-- todo replace with monaco -->
  <code class="whitespace-break-spaces text-sm pt-4">
    {quadlet}
  </code>

  <footer>
    <div class="w-full flex flex-row gap-x-2 justify-end">
      <!-- TODO: <Button disabled={loading || !generated} icon={faFloppyDisk} title="Save">Save</Button> -->
      <Button
        disabled={loading || !generated}
        icon={faTruckRampBox}
        title="Save into podman machine"
        on:click={saveIntoMachine}>Save into podman machine</Button>
    </div>
  </footer>
</div>
