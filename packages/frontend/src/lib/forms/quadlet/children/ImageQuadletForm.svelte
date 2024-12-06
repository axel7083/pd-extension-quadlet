<script lang="ts">
import { type QuadletChildrenFormProps, RESOURCE_ID_QUERY } from '/@/lib/forms/quadlet/quadlet-utils';
import type { SimpleImageInfo } from '/@shared/src/models/simple-image-info';
import { imageAPI } from '/@/api/client';
import { router } from 'tinro';
import ImagesSelect from '/@/lib/select/ImagesSelect.svelte';

let { loading = $bindable(), resourceId: imageId, provider, onError, onChange }: QuadletChildrenFormProps = $props();

let images: SimpleImageInfo[] | undefined = $state();

// use the query parameter containerId
let selectedImage: SimpleImageInfo | undefined = $derived(images?.find(image => image.id === imageId));

async function listImages(): Promise<void> {
  if (!provider) throw new Error('no container provider connection selected');
  loading = true;
  // reset
  images = [];

  try {
    images = await imageAPI.all($state.snapshot(provider));
  } catch (err: unknown) {
    onError(`Something went wrong while listing images for provider ${provider.providerId}: ${String(err)}`);
  } finally {
    loading = false;
  }
}

function onImageChange(value: SimpleImageInfo | undefined): void {
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
  if (provider && !selectedImage && images === undefined && loading === false) {
    listImages().catch(console.error);
  }
});
</script>

<!-- image list -->
<label for="image" class="pt-4 block mb-2 font-bold text-[var(--pd-content-card-header-text)]">Image</label>
<ImagesSelect
  disabled={loading || provider === undefined}
  onChange={onImageChange}
  value={selectedImage}
  images={images ?? []} />
