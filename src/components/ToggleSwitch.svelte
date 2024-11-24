<script lang="ts">
  import { Toggle } from "bits-ui";

  interface Props {
    pressed?: boolean;
    label?: string;
    onPressedChange?: (pressed: boolean) => void;
    disabled?: boolean;
  }

  let {
    pressed = false,
    label = "",
    onPressedChange = undefined,
    disabled = false,
  }: Props = $props();
</script>

<Toggle.Root
  {disabled}
  bind:pressed
  {onPressedChange}
  aria-label={label}
  class="
    inline-flex h-6 w-11 
    items-center rounded-full 
    border border-black/10
    transition-colors duration-200
    data-[state=on]:bg-blue-400/40
    data-[state=off]:bg-red-400/40
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  <div
    class="
      pointer-events-none
      h-5 w-5
      translate-x-0.5
      rounded-full
      bg-white
      shadow-lg
      transition-transform
      duration-200
      data-[state=on]:translate-x-[1.25rem]
    "
  ></div>
</Toggle.Root>

{#if label}
  <span class="ml-2 text-sm text-inherit/70">{label}</span>
{/if}
