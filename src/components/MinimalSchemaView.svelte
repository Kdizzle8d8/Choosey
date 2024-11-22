<script lang="ts">
  import type { Schema } from "../lib/types";
  import FieldInput from "./FieldInput.svelte";

  interface Props {
    schema: Schema;
    onActivate: () => void;
    onDelete: () => void;
    currentUrl: string;
  }

  let { schema, onActivate, onDelete, currentUrl }: Props = $props();
</script>

<div
  class="flex items-center justify-between p-2 backdrop-blur-sm bg-black/20 border border-black/20 rounded-lg opacity-50"
>
  <div class="flex gap-2">
    <button
      class="px-2 py-1 rounded text-sm text-red-400 transition-all duration-300 hover:bg-red-400/20"
      onclick={onDelete}
    >
      Delete
    </button>
  </div>
</div>
