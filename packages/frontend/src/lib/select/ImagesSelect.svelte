<script lang="ts">
import Select from '/@/lib/select/Select.svelte';
import type { SimpleImageInfo } from '/@shared/src/models/simple-image-info';

interface Props {
  value: SimpleImageInfo | undefined;
  onChange?: (value: SimpleImageInfo | undefined) => void;
  images: SimpleImageInfo[];
  disabled?: boolean;
}

let { value = $bindable(), images, onChange, disabled }: Props = $props();

/**
 * Handy mechanism to provide the mandatory property `label` and `value` to the Select component
 */
let selected: (SimpleImageInfo & { label: string; value: string }) | undefined = $derived.by(() => {
  if (value) {
    return { ...value, label: value.name, value: value.name };
  }
  return undefined;
});

function handleOnChange(nValue: SimpleImageInfo | undefined): void {
  value = nValue;
  onChange?.(value);
}
</script>

<Select
  label="Select Image"
  name="select-image"
  disabled={disabled}
  value={selected}
  onchange={handleOnChange}
  placeholder="Select image to use"
  items={images.map(image => ({
    ...image,
    value: image.name,
    label: image.name,
  }))}>
  <div slot="item" let:item>
    <div class="flex items-center">
      <div class="grow">
        <span>{item.name.substring(1)}</span>
      </div>
    </div>
  </div>
</Select>
