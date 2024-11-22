<script lang="ts">
  interface Props {
    label: string;
    onClick: () => void;
  }

  let { label, onClick }: Props = $props();
</script>

<button
  class="w-full py-1 rounded text-sm text-inherit/70 transition-all duration-300 hover:bg-black/20 border border-black/10"
  onclick={onClick}
>
  {label}
</button>
