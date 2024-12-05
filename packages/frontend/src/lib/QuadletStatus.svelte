<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';
import { router } from 'tinro';

interface Props {
  object: QuadletInfo;
}

let { object }: Props = $props();

let status: string = $derived.by(() => {
  if (object.isActive) {
    return 'RUNNING';
  } else {
    return '';
  }
});

function openDetails(quadlet: QuadletInfo): void {
  return router.goto(`/quadlets/${quadlet.connection.providerId}/${quadlet.connection.name}/${quadlet.id}`);
}
</script>

{#snippet icon()}
  <Fa size="1.125x" icon={faFileLines} />
{/snippet}

<button onclick={openDetails.bind(undefined, object)}>
  <StatusIcon status={status} icon={icon} />
</button>
