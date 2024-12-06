<script lang="ts">
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

import {
  Button,
  Table,
  TableColumn,
  TableRow,
  NavPage,
  TableSimpleColumn,
  EmptyScreen,
} from '@podman-desktop/ui-svelte';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import QuadletStatus from '../lib/QuadletStatus.svelte';
import { quadletAPI } from '../api/client';
import QuadletActions from '../lib/table/QuadletActions.svelte';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate';
import { quadletsInfo } from '/@store/quadlets';
import { router } from 'tinro';
import ContainerProviderConnectionSelect from '/@/lib/select/ContainerProviderConnectionSelect.svelte';
import { providerConnectionsInfo } from '/@store/connections';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';
import { faCode } from '@fortawesome/free-solid-svg-icons/faCode';

const columns = [
  new TableColumn<QuadletInfo>('Status', { width: '70px', renderer: QuadletStatus, align: 'center' }),
  new TableColumn<QuadletInfo, string>('Service name', {
    renderer: TableSimpleColumn,
    align: 'left',
    renderMapping: (quadletsInfo: QuadletInfo) => quadletsInfo.id,
  }),
  new TableColumn<QuadletInfo, string>('Path', {
    renderer: TableSimpleColumn,
    align: 'left',
    renderMapping: (quadletsInfo: QuadletInfo) => quadletsInfo.path,
  }),
  new TableColumn<QuadletInfo>('Actions', { align: 'right', width: '120px', renderer: QuadletActions }),
];
const row = new TableRow<QuadletInfo>({ selectable: (_service): boolean => true });

let loading: boolean = $state(false);
async function refreshQuadlets(): Promise<void> {
  loading = true;
  try {
    await quadletAPI.refresh();
  } finally {
    loading = false;
  }
}

// undefined mean all
let containerProviderConnection: ProviderContainerConnectionDetailedInfo | undefined = $state(undefined);
let searchTerm: string = $state('');

let data: (QuadletInfo & { selected?: boolean })[] = $derived.by(() => {
  return $quadletsInfo.reduce((output, current) => {
    let match = true;
    if (containerProviderConnection) {
      match =
        current.connection.providerId === containerProviderConnection.providerId &&
        current.connection.name === containerProviderConnection.name;
    }

    if (match && searchTerm.length > 0) {
      match = current.id.includes(searchTerm);
    }

    if (match) {
      output.push(current);
    }

    return output;
  }, [] as QuadletInfo[]);
});

function navigateToGenerate(): void {
  router.goto('/quadlets/generate');
}
</script>

<NavPage title="Podman Quadlets" searchEnabled={true} bind:searchTerm={searchTerm}>
  <svelte:fragment slot="additional-actions">
    <Button icon={faCode} disabled={loading} title="Generate Quadlet" on:click={navigateToGenerate}
      >Generate Quadlet</Button>
    <Button
      icon={faArrowsRotate}
      inProgress={loading}
      disabled={loading}
      title="Refresh Quadlets"
      on:click={refreshQuadlets}>Refresh</Button>
  </svelte:fragment>
  <svelte:fragment slot="bottom-additional-actions">
    <div class="w-full flex justify-end">
      <div class="w-[250px]">
        <ContainerProviderConnectionSelect
          bind:value={containerProviderConnection}
          containerProviderConnections={$providerConnectionsInfo} />
      </div>
    </div>
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if data?.length > 0}
      <Table kind="service" data={data} columns={columns} row={row} />
    {:else}
      <EmptyScreen icon={faArrowsRotate} title={'No Quadlet found on the system'} message=""></EmptyScreen>
    {/if}
  </svelte:fragment>
</NavPage>
