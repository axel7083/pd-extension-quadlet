<script lang="ts">
import { type QuadletChildrenFormProps, RESOURCE_ID_QUERY } from '/@/lib/forms/quadlet/quadlet-utils';
import type { SimpleContainerInfo } from '/@shared/src/models/simple-container-info';
import { containerAPI, podletAPI } from '/@/api/client';
import { router } from 'tinro';
import ContainersSelect from '/@/lib/select/ContainersSelect.svelte';

let {
  loading = $bindable(),
  resourceId: containerId,
  provider,
  onError,
  onChange,
}: QuadletChildrenFormProps = $props();

let containers: SimpleContainerInfo[] | undefined = $state();

// use the query parameter containerId
let selectedContainer: SimpleContainerInfo | undefined = $derived(
  containers?.find(container => container.id === containerId),
);

async function listContainers(): Promise<void> {
  if (!provider) throw new Error('no container provider connection selected');
  loading = true;
  // reset
  containers = [];

  try {
    containers = await containerAPI.all($state.snapshot(provider));
  } catch (err: unknown) {
    onError(`Something went wrong while listing containers for provider ${provider.providerId}: ${String(err)}`);
  } finally {
    loading = false;
  }
}

function onContainerChange(value: SimpleContainerInfo | undefined): void {
  if (!value) {
    router.location.query.delete(RESOURCE_ID_QUERY);
    return;
  }

  router.location.query.set(RESOURCE_ID_QUERY, value.id);
  onChange();
}

// if we mount the component, and query parameters with all the values defined
// we need to fetch manually the containers
$effect(() => {
  if (provider && !selectedContainer && containers === undefined && loading === false) {
    listContainers().catch(console.error);
  }
});
</script>

<!-- container list -->
<label for="container" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]">Container</label>
<ContainersSelect
  disabled={loading || provider === undefined}
  onChange={onContainerChange}
  value={selectedContainer}
  containers={containers ?? []} />
