<script lang="ts">
  interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }

  let { label, value, onChange }: Props = $props();
</script>

<div class="flex items-center gap-3">
  <span class="text-sm text-inherit/70">{label}</span>
  <input
    type="text"
    {value}
    onchange={(e) => onChange(e.currentTarget.value)}
    class="flex-1 bg-black/10 border border-black/10 rounded px-2 py-1 text-inherit text-sm focus:outline-none focus:border-blue-400/40"
  />
</div>
