<script lang="ts">
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button, ErrorMessage } from '@podman-desktop/ui-svelte';
import { podletAPI } from '/@/api/client';

interface Props {
  loading: boolean;
  onInstallCompleted: (err?: Error) => void;
}

let { loading = $bindable(), onInstallCompleted }: Props = $props();

let error: string | undefined = $state(undefined);

async function installPodlet(): Promise<void> {
  loading = true;
  error = undefined;
  try {
    await podletAPI.install();
    onInstallCompleted();
  } catch (err: unknown) {
    const stringifyError = `Something went wrong while trying to install podlet: ${err}`;
    error = stringifyError;
    onInstallCompleted(new Error(stringifyError));
  } finally {
    loading = false;
  }
}
</script>

{#if error}
  <ErrorMessage error={error} />
{/if}
<Button inProgress={loading} icon={faDownload} on:click={installPodlet} title="Install Podlet"
  >Installing Podlet</Button>
