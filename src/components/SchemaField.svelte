<script lang="ts">
  import type { RuntimeSchema } from "../lib/types";
  import ElementSelector from "./ElementSelector.svelte";
  import FieldInput from "./FieldInput.svelte";

  interface Props {
    field: RuntimeSchema["Fields"][number];
    fieldIndex: number;
    schema: RuntimeSchema;
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

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "link", label: "Link" },
  ];

  // Handle MaxMatches change
  const handleMaxMatchesChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    field.MaxMatches = input.valueAsNumber;

    // Re-run matches if element exists
    if (schema.ParentMatch?.matches && field.Element) {
      updateChildMatches(schema, field, "exact");
    }
  };

  // Handle name change
  const handleNameChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    field.Name = input.value;
  };

  // Auto-update matches when element is selected
  $effect(() => {
    if (field.Element && !field.Matches.length && schema.ParentMatch?.matches) {
      updateChildMatches(schema, field, "exact");
    }
  });
</script>

<div class="flex flex-col gap-2">
  <!-- First row: Field Name -->
  <div class="flex flex-col gap-1">
    <label class="text-xs text-inherit/70">Field Name</label>
    <input
      type="text"
      class="px-2 py-1 rounded text-sm bg-black/10 border border-black/10"
      value={field.Name}
      oninput={handleNameChange}
    />
  </div>

  <!-- Second row: Type, Max Matches, and Element Selector -->
  <div class="flex gap-4">
    <div class="flex flex-col gap-1">
      <label for="field-type" class="text-xs text-inherit/70">Type</label>
      <select
        id="field-type"
        class="w-24 px-2 py-1 rounded text-sm bg-black/10 border border-black/10 text-inherit"
        bind:value={field.Type}
      >
        {#each fieldTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs text-inherit/70" for="max-matches"
        >Max Matches</label
      >
      <input
        id="max-matches"
        type="number"
        min="1"
        class="w-20 px-2 py-1 rounded text-sm bg-black/10 border border-black/10"
        value={field.MaxMatches}
        oninput={handleMaxMatchesChange}
      />
    </div>

    <div class="flex flex-col gap-1 flex-1">
      <div class="flex gap-2">
        <ElementSelector
          element={field.Element}
          onSelect={() => startSelectingFor("element", schema, field)}
          onNavigate={(direction: "parent" | "child") =>
            navigateElement(direction, schema, field)}
          onHover={(isHovering: boolean) =>
            isHovering
              ? highlightElement(field.Element)
              : clearHighlight(field.Element)}
          class="flex-1"
        />
      </div>
    </div>
  </div>

  {#if field.Matches && field.Matches.length > 0}
    <div class="text-sm text-yellow-400">
      Found {field.Matches.length} matching elements
    </div>
  {/if}
</div>
