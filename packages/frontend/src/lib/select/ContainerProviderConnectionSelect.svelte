<script lang="ts">
import Select from '/@/lib/select/Select.svelte';

export let disabled: boolean = false;
import { VMType } from '/@shared/src/utils/vm-types';
import type {
  ProviderContainerConnectionDetailedInfo
} from '/@shared/src/models/provider-container-connection-detailed-info';

/**
 * Current value selected
 */
export let value: ProviderContainerConnectionDetailedInfo | undefined = undefined;
export let containerProviderConnections: ProviderContainerConnectionDetailedInfo[] = [];
/**
 * Handy mechanism to provide the mandatory property `label` and `value` to the Select component
 */
let selected: (ProviderContainerConnectionDetailedInfo & { label: string; value: string }) | undefined = undefined;
$: {
  // let's select a default model
  if (value) {
    selected = { ...value, label: value.name, value: value.name };
  }
}

function handleOnChange(nValue: ProviderContainerConnectionDetailedInfo | undefined): void {
  value = nValue;
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

      {#if item.vmType !== VMType.UNKNOWN}
        <div>({item.vmType})</div>
      {/if}
    </div>
  </div>
</Select>
