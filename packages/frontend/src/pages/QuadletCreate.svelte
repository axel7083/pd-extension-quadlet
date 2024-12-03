<script lang="ts">
import { FormPage } from '@podman-desktop/ui-svelte';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';
import { router } from 'tinro';

export function close(): void {
  router.goto('/');
}
</script>

<FormPage title="Create Quadlet" onclose={close}>
  <svelte:fragment slot="icon">
    <div class="rounded-full w-8 h-8 flex items-center justify-center">
      <Fa size="1.125x" class="text-[var(--pd-content-header-icon)]" icon={faPlusCircle} />
    </div>
  </svelte:fragment>
  <svelte:fragment slot="content">
    <div class="flex flex-col w-full">
      <span>Hello world from create page</span>
    </div>
  </svelte:fragment>
</FormPage>