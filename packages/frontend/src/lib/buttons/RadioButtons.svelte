<script lang="ts">
interface Radio {
  id: string;
  label: string;
}

interface Props {
  options: Radio[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

let { options, value, onChange, disabled }: Props = $props();

function onclick(id: string): void {
  if (disabled) return;
  onChange(id);
}
</script>

<ul class="text-sm text-center rounded-lg shadow bg-[var(--pd-action-button-bg)] flex overflow-hidden">
  {#each options as option (option.id)}
    {@const selected = value === option.id}
    <li class="w-full">
      <button
        onclick={onclick.bind(undefined, option.id)}
        class:bg-[var(--pd-button-primary-bg)]={selected && !disabled}
        class:bg-[var(--pd-button-disabled)]={disabled}
        class:cursor-not-allowed={disabled}
        class="inline-block py-2 w-full bg-gray-100"
        aria-current="page">
        {option.label}
      </button>
    </li>
  {/each}
</ul>
