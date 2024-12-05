<script lang="ts">
import Select from '/@/lib/select/Select.svelte';
import { VMType } from '/@shared/src/utils/vm-types';
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';

interface Props {
  value: ProviderContainerConnectionDetailedInfo | undefined;
  onChange?: (value: ProviderContainerConnectionDetailedInfo | undefined) => void;
  containerProviderConnections: ProviderContainerConnectionDetailedInfo[];
  disabled?: boolean;
}

let { value = $bindable(), containerProviderConnections, onChange, disabled }: Props = $props();

/**
 * Handy mechanism to provide the mandatory property `label` and `value` to the Select component
 */
let selected: (ProviderContainerConnectionDetailedInfo & { label: string; value: string }) | undefined = $derived.by(
  () => {
    if (value) {
      return { ...value, label: value.name, value: value.name };
    }
  },
);

function handleOnChange(nValue: ProviderContainerConnectionDetailedInfo | undefined): void {
  value = nValue;
  onChange?.(value);
}
</script>

<Select
  label="Select Container Engine"
  name="select-container-engine"
  disabled={disabled}
  value={selected}
  onchange={handleOnChange}
  placeholder="Select container provider to use"
  items={containerProviderConnections.map(containerProviderConnection => ({
    ...containerProviderConnection,
    value: containerProviderConnection.name,
    label: containerProviderConnection.name,
  }))}>
  <div slot="item" let:item>
    <div class="flex items-center">
      <div class="grow">
        <span>{item.name}</span>
      </div>

      {#if item.vmType && item.vmType !== VMType.UNKNOWN}
        <div>({item.vmType})</div>
      {/if}
    </div>
  </div>
</Select>
