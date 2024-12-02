<script lang="ts">
import { faHandSpock, faPlusCircle, faRocket } from '@fortawesome/free-solid-svg-icons';
import { quadletsInfo } from '/@/stores/quadlets';

import {
  Button,
  Table,
  TableColumn,
  TableRow,
  NavPage,
  TableSimpleColumn,
  TableDurationColumn,
  EmptyScreen,
  Spinner,
} from '@podman-desktop/ui-svelte';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import QuadletStatus from '/@/lib/QuadletStatus.svelte';
import { quadletAPI } from '/@/api/client';
import QuadletActions from '/@/lib/table/QuadletActions.svelte';

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

let data: (QuadletInfo & { selected?: boolean })[] = $derived($quadletsInfo);

let loading: boolean = $state(false);
async function refreshQuadlets(): Promise<void> {
  loading = true;
  try {
    await quadletAPI.refresh();
  } finally {
    loading = false;
  }
}
</script>

<NavPage title="Podman Quadlets" searchEnabled={false}>
  <svelte:fragment slot="additional-actions">
    <!-- {#if $quadletsInfoLastUpdate}
      <TableDurationColumn object={new Date($quadletsInfoLastUpdate)}/>
    {/if} -->
    <Button
      icon={faPlusCircle}
      inProgress={loading}
      disabled={loading}
      title="Refresh Quadlets"
      on:click={refreshQuadlets}>Refresh</Button>
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if data?.length > 0}
      <Table kind="service" data={data} columns={columns} row={row} />
    {:else}
      <EmptyScreen icon={faRocket} title={'No Quadlet found on the system'} message=""></EmptyScreen>
    {/if}
  </svelte:fragment>
</NavPage>
