<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';
import type { QuadletInfo } from '/@shared/src/models/quadlet-info';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';

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
</script>

{#snippet icon()}
  <Fa size="lg" icon={faFileLines} />
{/snippet}

<StatusIcon status={status} icon={icon} />
