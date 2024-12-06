<script lang="ts">
interface Step {
  id: string;
  label: string;
}

interface Props {
  value: string;
  steps: Step[];
}

let { value, steps }: Props = $props();
</script>

<div aria-label="stepper" class="flex items-center w-full pt-4">
  {#each steps as step, index (step.id)}
    {@const selected = step.id === value}
    <div class:text-purple-500={selected} class="flex items-center justify-center">
      <span
        class:border-purple-500={selected}
        class="flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0">
        {index + 1}
      </span>
      {step.label}
    </div>
    {#if index < steps.length - 1}
      <div class="border-b border-gray-400 border-1 grow mx-6"></div>
    {/if}
  {/each}
</div>
