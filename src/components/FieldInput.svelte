<script lang="ts">
  interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }

  let { label, value, onChange }: Props = $props();
</script>

<div class="flex flex-col gap-1">
  <label class="text-xs text-inherit/70">{label}</label>
  <input
    type="text"
    class="px-2 py-1 rounded text-sm bg-black/10 border border-black/10"
    {value}
    on:input={(e) => onChange(e.currentTarget.value)}
  />
</div>
