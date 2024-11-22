<script lang="ts">
  import type { Schema, MatchStrategy } from "../lib/types";
  import ElementSelector from "./ElementSelector.svelte";
  import FieldInput from "./FieldInput.svelte";

  interface Props {
    field: Schema["Fields"][0];
    fieldIndex: number;
    schema: Schema;
    startSelectingFor: Function;
    navigateElement: Function;
    highlightElement: Function;
    clearHighlight: Function;
    updateChildMatches: Function;
  }

  let {
    field = $bindable(),
    fieldIndex,
    schema,
    startSelectingFor,
    navigateElement,
    highlightElement,
    clearHighlight,
    updateChildMatches,
  }: Props = $props();

  // Handle MaxMatches change
  const handleMaxMatchesChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    field.MaxMatches = input.valueAsNumber;

    // Re-run matches with current strategy if matches exist
    if (schema.ParentMatch?.strategy && field.Element) {
      updateChildMatches(schema, field, schema.ParentMatch.strategy);
    }
  };
</script>

<div class="flex flex-col gap-2">
  <div class="flex gap-3">
    <FieldInput
      label="Field Name"
      value={field.Name}
      onChange={(value) => (field.Name = value)}
    />
    <div class="flex items-center gap-2">
      <label class="text-sm text-inherit/70" for="max-matches">
        Max Matches
      </label>
      <input
        id="max-matches"
        type="number"
        min="1"
        class="w-16 px-2 py-1 rounded bg-black/10 border border-black/10"
        value={field.MaxMatches || ""}
        oninput={handleMaxMatchesChange}
      />
    </div>
  </div>

  <div class="flex items-center gap-3">
    <span class="text-sm text-inherit/70">Element</span>
    <ElementSelector
      element={field.Element}
      onSelect={() => startSelectingFor("element", schema, field)}
      onNavigate={(direction) => navigateElement(direction, schema, field)}
      onHover={(isHovering) =>
        isHovering
          ? highlightElement(field.Element)
          : clearHighlight(field.Element)}
    />

    {#if field.Element}
      <div class="flex gap-1">
        {#each ["exact", "similar", "xpath", "selector"] as strategy}
          <button
            class="px-2 py-1 rounded text-sm text-inherit/70 transition-all duration-300 hover:bg-black/20 border border-black/10"
            onclick={() => updateChildMatches(schema, field, strategy)}
          >
            {#if strategy === "exact"}=
            {:else if strategy === "similar"}≈
            {:else if strategy === "xpath"}/
            {:else}#
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if field.Matches && field.Matches.length > 0}
    <div class="ml-4 text-sm text-yellow-400">
      Found {field.Matches.length} matching elements
    </div>
  {/if}
</div>
