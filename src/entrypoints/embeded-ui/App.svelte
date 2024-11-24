<script lang="ts">
  import { Collapsible } from "bits-ui";
  import { slide } from "svelte/transition";
  import { scale } from "svelte/transition";
  import "../../style.css";
  import ElementSelector from "../../components/ElementSelector.svelte";
  import FieldInput from "../../components/FieldInput.svelte";
  import ActionButton from "../../components/ActionButton.svelte";
  import SchemaField from "../../components/SchemaField.svelte";
  import type {
    Schema,
    MatchStrategy,
    StoredSchema,
    EditingSchema,
  } from "../../lib/types";
  import {
    findMatches,
    findChildMatches,
    findRelativeElement,
  } from "../../lib/match";
  import {
    highlightElement,
    highlightHoveredElement,
    highlightSelectedElement,
    highlightMatches,
    clearHighlight,
    clearHighlights,
  } from "../../lib/highlight";
  import { storage } from "wxt/storage";
  import { ScrapingEngine } from "@/lib/scrapingEngine/engine";

  let collapsed = $state(true);
  let isDarkMode = $state(false);
  let isSelecting = $state(false);
  let selectedElements = $state<HTMLElement[]>([]);
  let hoveredElement: HTMLElement | null = null;
  let schemas = $state<EditingSchema[]>([]);

  // Add new state variables for selection tracking
  let selectingFor: {
    type: "parent" | "element";
    schema: EditingSchema;
    field?: EditingSchema["Fields"][0];
  } | null = $state(null);

  // Add state for tracking which schemas are open
  let openSchemas = $state<number[]>([]);

  const toggleCollapse = () => {
    collapsed = !collapsed;

    if (collapsed) {
      // Clear all highlights when closing
      schemas.forEach((schema) => {
        if (schema.ParentMatch?.matches) {
          clearHighlights(schema.ParentMatch.matches);
          // Clear child matches
          schema.Fields.forEach((field) => {
            clearHighlights(field.Matches);
          });
        }
      });
    } else {
      // Re-run matches when opening
      schemas.forEach((schema) => {
        if (schema.Parent && schema.ParentMatch?.strategy) {
          updateParentMatches(schema, schema.ParentMatch.strategy);

          schema.Fields.forEach((field) => {
            if (field.Element && field.strategy) {
              updateChildMatches(schema, field, field.strategy);
            }
          });
        }
      });
    }
  };

  const toggleSelectMode = () => {
    isSelecting = !isSelecting;
    if (!isSelecting) {
      // Clean up hover effect when turning off select mode
      if (hoveredElement) {
        hoveredElement.style.outline = "";
      }
    }
  };

  const handleMouseOver = (event: MouseEvent) => {
    if (!isSelecting) return;

    const target = event.target as HTMLElement;
    if (target === hoveredElement) return;

    // Remove highlight from previous element
    if (hoveredElement) {
      if (selectedElements.includes(hoveredElement)) {
        highlightSelectedElement(hoveredElement);
      } else {
        clearHighlight(hoveredElement);
      }
    }

    // Add highlight to new element
    hoveredElement = target;
    highlightHoveredElement(target, selectedElements.includes(target));

    event.stopPropagation();
  };

  const handleMouseOut = (event: MouseEvent) => {
    if (!isSelecting || !hoveredElement) return;

    // Restore highlight for selected elements, remove for others
    if (selectedElements.includes(hoveredElement)) {
      highlightSelectedElement(hoveredElement);
    } else {
      clearHighlight(hoveredElement);
    }
    hoveredElement = null;
  };

  const startSelectingFor = (
    type: "parent" | "element",
    schema: EditingSchema,
    field?: EditingSchema["Fields"][0]
  ) => {
    selectingFor = { type, schema, field };
    isSelecting = true;
  };

  const handleElementSelection = async (element: HTMLElement) => {
    if (!selectingFor) return;

    if (selectingFor.type === "parent") {
      selectingFor.schema.Parent = element;
      if (selectingFor.schema.ParentMatch) {
        clearHighlights(selectingFor.schema.ParentMatch.matches);
        selectingFor.schema.ParentMatch = null;
      }
      await updateParentMatches(selectingFor.schema, "exact");
    } else if (selectingFor.type === "element" && selectingFor.field) {
      clearHighlights(selectingFor.field.Matches);
      selectingFor.field.Element = element;

      if (selectingFor.schema.ParentMatch?.matches) {
        const result = await findChildMatches(
          selectingFor.schema.ParentMatch.matches,
          element,
          document,
          selectingFor.field.strategy,
          selectingFor.field.MaxMatches
        );
        selectingFor.field.strategy = result.strategy;
        selectingFor.field.Matches = result.matches;
        highlightMatches(selectingFor.field.Matches);
      }
    }

    isSelecting = false;
    selectingFor = null;
    clearSelection();
  };

  // Modify handleContextMenu to use new selection logic
  const handleContextMenu = (event: MouseEvent) => {
    if (!isSelecting) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;

    if (selectingFor) {
      handleElementSelection(target);
    } else {
      const index = selectedElements.findIndex((el) => el === target);
      if (index === -1) {
        selectedElements = [...selectedElements, target];
        target.style.outline = "2px solid #ff4444";
        target.style.outlineOffset = "1px";
      } else {
        selectedElements = selectedElements.filter((el) => el !== target);
        target.style.outline = "";

        if (target === hoveredElement) {
          target.style.outline = "2px dashed #4a90e2";
          target.style.outlineOffset = "1px";
        }
      }
    }
  };

  const clearAllElementStyles = () => {
    clearHighlights(selectedElements);

    if (hoveredElement) {
      clearHighlight(hoveredElement);
    }

    if (selectingFor) {
      if (selectingFor.type === "parent" && selectingFor.schema.Parent) {
        clearHighlight(selectingFor.schema.Parent);
      } else if (
        selectingFor.type === "element" &&
        selectingFor.field?.Element
      ) {
        clearHighlight(selectingFor.field.Element);
      }
    }
  };

  const clearSelection = () => {
    clearAllElementStyles();
    selectedElements = [];
    hoveredElement = null;
  };

  const cancelSelection = () => {
    // If we're selecting for a specific field, clear it
    if (selectingFor) {
      if (selectingFor.type === "parent") {
        selectingFor.schema.Parent = null;
      } else if (selectingFor.type === "element" && selectingFor.field) {
        selectingFor.field.Element = null;
      }
    }

    // Clear all visual styles and selection states
    clearAllElementStyles();
    isSelecting = false;
    selectingFor = null;
    selectedElements = [];
    hoveredElement = null;
  };

  // Set up global event listeners
  $effect(() => {
    if (isSelecting) {
      document.addEventListener("mouseover", handleMouseOver);
      document.addEventListener("mouseout", handleMouseOut);
      document.addEventListener("contextmenu", handleContextMenu, true);
    }

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  });

  $effect(() => {
    const detectColorScheme = () => {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const rgb = bodyBg.match(/\d+/g)?.map(Number);
      if (rgb) {
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        isDarkMode = brightness < 128;
      }
    };

    detectColorScheme();
    const observer = new MutationObserver(detectColorScheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  });

  // Message listener...
  $effect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "toggle-ui") {
        toggleCollapse();
      }
    });
  });

  const updateChildMatches = async (
    schema: EditingSchema,
    field: EditingSchema["Fields"][0],
    strategy: MatchStrategy
  ) => {
    console.log("Updating child matches:", { field, strategy });

    if (!schema.ParentMatch?.matches || !field.Element) {
      console.log("Missing required elements:", {
        hasParentMatches: !!schema.ParentMatch?.matches,
        hasFieldElement: !!field.Element,
      });
      return;
    }

    clearHighlights(field.Matches);

    const result = await findChildMatches(
      schema.ParentMatch.matches,
      field.Element,
      document,
      strategy,
      field.MaxMatches
    );

    console.log("Child match result:", result);

    field.strategy = result.strategy;
    field.Matches = result.matches;

    highlightMatches(field.Matches);
  };

  const updateParentMatches = async (
    schema: EditingSchema,
    strategy: MatchStrategy
  ) => {
    if (!schema.Parent) return;

    if (schema.ParentMatch?.matches) {
      clearHighlights(schema.ParentMatch.matches);
      schema.Fields.forEach((field) => {
        clearHighlights(field.Matches);
      });
    }

    const matches = await findMatches(schema.Parent, strategy, 3, document);
    schema.ParentMatch = {
      strategy,
      matches,
    };

    highlightMatches(matches);

    // Re-run child matches
    for (const field of schema.Fields) {
      if (field.Element && field.strategy) {
        await updateChildMatches(schema, field, field.strategy);
      }
    }
  };

  const createSchema = () => {
    schemas = [
      ...schemas,
      {
        Name: "New Schema",
        urls: [window.location.href],
        Parent: null,
        ParentMatch: null,
        Fields: [],
      },
    ];
  };

  const addField = (schema: EditingSchema) => {
    schema.Fields = [
      ...schema.Fields,
      {
        Name: "New Field",
        Type: "text" as const,
        Element: null,
        Matches: [],
        strategy: undefined,
      },
    ];
  };

  $effect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSelecting) {
        cancelSelection();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  // Add this validation function
  const isCompleteSchema = (schema: EditingSchema): boolean => {
    return !!(
      schema.Parent &&
      schema.ParentMatch &&
      schema.Fields.every(
        (field) => field.Element && field.strategy && field.Name && field.Type
      )
    );
  };

  const evaluateSchemas = () => {
    const completeSchemas = schemas.filter(isCompleteSchema);
    completeSchemas.forEach((schema) => {
      const engine = new ScrapingEngine(schema as Schema, document);
      const results = engine.scrape();
      console.log(results);
    });
  };

  const navigateElement = async (
    direction: "parent" | "child",
    schema: EditingSchema,
    field?: EditingSchema["Fields"][0]
  ) => {
    if (field) {
      if (!field.Element) return;
      const relative = findRelativeElement(field.Element, direction);
      if (relative) {
        field.Element = relative;
        if (schema.ParentMatch?.matches) {
          clearHighlights(field.Matches);
          const result = await findChildMatches(
            schema.ParentMatch.matches,
            relative,
            document,
            field.strategy,
            field.MaxMatches
          );
          field.strategy = result.strategy;
          field.Matches = result.matches;
          highlightMatches(field.Matches);
        }
      }
    } else {
      // Navigate parent element
      if (!schema.Parent) return;
      const relative = findRelativeElement(schema.Parent, direction);
      if (relative) {
        schema.Parent = relative;
        // Clear existing matches
        if (schema.ParentMatch) {
          clearHighlights(schema.ParentMatch.matches);
          schema.ParentMatch = null;
        }
      }
    }
  };

  const deleteSchema = (index: number) => {
    // Clear highlights for the schema being deleted
    const schema = schemas[index];
    if (schema.ParentMatch?.matches) {
      clearHighlights(schema.ParentMatch.matches);
    }
    schema.Fields.forEach((field) => {
      clearHighlights(field.Matches);
    });

    // Remove the schema
    schemas = schemas.filter((_, i) => i !== index);

    // Persist changes to storage
    saveSchemas();
  };

  // Convert Schema to StoredSchema for storage
  const schemaToStored = (schema: EditingSchema): StoredSchema => ({
    Name: schema.Name,
    Parent: schema.Parent?.outerHTML || null,
    urls: schema.urls,
    ParentMatch: schema.ParentMatch
      ? {
          strategy: schema.ParentMatch.strategy,
        }
      : null,
    Fields: schema.Fields.map((field) => ({
      Name: field.Name,
      Type: field.Type,
      Element: field.Element?.outerHTML || null,
      MaxMatches: field.MaxMatches,
      strategy: field.strategy,
    })),
  });

  // Helper function to create element from HTML string
  const createElementFromHTML = (htmlString: string): HTMLElement => {
    const div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstElementChild as HTMLElement;
  };

  // Convert stored schema back to runtime Schema
  const storedToSchema = async (
    stored: StoredSchema
  ): Promise<EditingSchema> => {
    const oldParent = stored.Parent
      ? createElementFromHTML(stored.Parent)
      : null;

    const parentMatches = oldParent
      ? await findMatches(
          oldParent,
          stored.ParentMatch?.strategy || "exact",
          3,
          document
        )
      : [];

    const parentElement = parentMatches.length > 0 ? parentMatches[0] : null;

    const fields = await Promise.all(
      stored.Fields.map(async (field) => {
        let element = null;
        if (field.Element && parentMatches.length > 0) {
          const tempElement = createElementFromHTML(field.Element);
          for (const parent of parentMatches) {
            const matches = await findMatches(
              tempElement,
              field.strategy || "exact",
              3,
              document
            );
            element = matches.find((match) => parent.contains(match)) || null;
            if (element) break;
          }
        }

        return {
          ...field,
          Element: element,
          Matches: [],
        };
      })
    );

    return {
      Name: stored.Name,
      urls: stored.urls,
      Parent: parentElement,
      ParentMatch: parentElement
        ? {
            strategy: stored.ParentMatch?.strategy || "exact",
            matches: parentMatches,
          }
        : null,
      Fields: fields,
    };
  };
  const isSchemaActive = (schema: StoredSchema) => {
    return Object.values(schema.urls).some(
      (url) => url === window.location.href
    );
  };

  const saveSchemas = () => {
    const storedSchemas = schemas.map(schemaToStored);
    console.log(storedSchemas);
    storage.setItem("local:schemas", storedSchemas);
  };

  onMount(() => {
    storage.getItem<StoredSchema[]>("local:schemas").then(async (result) => {
      if (result) {
        // first only load schemas that are active
        const loadedSchemas = await Promise.all(
          result.filter(isSchemaActive).map(storedToSchema)
        );
        schemas = loadedSchemas;

        if (!collapsed) {
          for (const schema of schemas) {
            if (schema.Parent && schema.ParentMatch?.strategy) {
              await updateParentMatches(schema, schema.ParentMatch.strategy);
            }
          }
        }
      }
    });
  });

  // Add this function near your other state management functions
  const handleCollapsibleChange = (index: number, isOpen: boolean) => {
    if (isOpen) {
      openSchemas = [...openSchemas, index];
    } else {
      openSchemas = openSchemas.filter((i) => i !== index);
    }
  };
</script>

<div
  class="fixed z-[999] top-1/2 right-0 -translate-y-1/2 transition-transform duration-300"
  class:translate-x-full={collapsed}
>
  <main
    class="backdrop-blur-md bg-white/30 border-4 border-r-0 border-blue-400/40 shadow-lg rounded-l-2xl p-8 w-[500px] h-[800px] relative glow-border overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
  >
    <button
      aria-label="Toggle collapse"
      onclick={toggleCollapse}
      class={`absolute -left-2 top-1/2 -translate-x-8 -translate-y-1/2 w-8 h-8 flex items-center focus:outline-none border-0 justify-center rounded-full hover:backdrop-blur-md transition-all duration-300 ${
        isDarkMode ? "hover:bg-white/20" : "hover:bg-black/20"
      }`}
      class:text-black={!isDarkMode}
      class:text-white={isDarkMode}
    >
      <svg
        class="w-4 h-4 transition-transform duration-300"
        class:rotate-180={collapsed}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>

    <h1
      class="text-4xl font-bold my-4"
      class:text-white={isDarkMode}
      class:text-black={!isDarkMode}
    >
      Choosey
    </h1>

    <!-- Schema Creator container -->
    <div class="flex flex-col gap-4">
      {#if schemas.length === 0}
        <p class="text-sm text-inherit/70 text-center">
          No schemas found. Create one?
        </p>
        <button
          class="px-4 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm bg-black/20 hover:bg-black/30 border border-black/20 text-inherit w-full"
          onclick={createSchema}
        >
          Create Schema
        </button>
      {:else}
        <div transition:scale={{ duration: 200 }}>
          {#each schemas as schema, i (schema)}
            <Collapsible.Root
              open={openSchemas.includes(i)}
              onOpenChange={(isOpen) => handleCollapsibleChange(i, isOpen)}
              class="mb-2"
            >
              <div
                class="flex items-center justify-between p-2 backdrop-blur-sm bg-black/20 border border-black/20 rounded-lg"
                class:rounded-b-none={openSchemas.includes(i)}
                class:border-b-0={openSchemas.includes(i)}
              >
                <FieldInput
                  label="Name"
                  value={schema.Name}
                  onChange={(value) => (schema.Name = value)}
                />
                <div class="flex gap-2">
                  <button
                    class="px-2 py-1 rounded text-sm text-red-400 transition-all duration-300 hover:bg-red-400/20"
                    onclick={() => deleteSchema(i)}
                  >
                    Delete
                  </button>
                  <Collapsible.Trigger
                    class="px-2 py-1 rounded text-sm text-inherit/70 transition-all duration-300 hover:bg-black/20 border border-black/10"
                  >
                    <svg
                      class="w-4 h-4 transition-transform duration-200"
                      class:rotate-180={openSchemas.includes(i)}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Collapsible.Trigger>
                </div>
              </div>

              <Collapsible.Content
                transition={slide}
                transitionConfig={{ duration: 200 }}
                class="p-4 space-y-3 rounded-lg border-t-0 border border-black/20 backdrop-blur-sm rounded-t-none bg-black/20"
              >
                <div class="flex items-center gap-3">
                  <span class="text-sm text-inherit/70">Parent</span>
                  <ElementSelector
                    element={schema.Parent}
                    onSelect={() => startSelectingFor("parent", schema)}
                    onNavigate={(direction) =>
                      navigateElement(direction, schema)}
                    onHover={(isHovering) =>
                      isHovering
                        ? highlightElement(schema.Parent)
                        : clearHighlight(schema.Parent)}
                  />

                  {#if schema.Parent}
                    <div class="flex gap-1">
                      {#snippet matchButton(
                        strategy: MatchStrategy,
                        symbol: string
                      )}
                        <button
                          class="px-2 py-1 rounded text-sm text-inherit/70 transition-all duration-300 hover:bg-black/20 border border-black/10"
                          onclick={() => updateParentMatches(schema, strategy)}
                        >
                          {symbol}
                        </button>
                      {/snippet}

                      {@render matchButton("exact", "=")}
                      {@render matchButton("similar", "≈")}
                      {@render matchButton("xpath", "/")}
                      {@render matchButton("selector", "#")}
                    </div>
                  {/if}
                </div>

                {#if schema.ParentMatch && schema.ParentMatch.matches.length > 0}
                  <div class="ml-4 text-sm text-yellow-400">
                    Found {schema.ParentMatch.matches.length} matching elements
                  </div>
                {/if}

                <div class="ml-4 space-y-3">
                  {#each schema.Fields as field, fieldIndex (field)}
                    <SchemaField
                      {field}
                      {fieldIndex}
                      {schema}
                      {startSelectingFor}
                      {navigateElement}
                      {highlightElement}
                      {clearHighlight}
                      {updateChildMatches}
                    />
                  {/each}
                </div>

                <ActionButton
                  label="+ Add Field"
                  onClick={() => addField(schema)}
                />
              </Collapsible.Content>
            </Collapsible.Root>
          {/each}

          <div class="mt-2">
            <ActionButton label="+ Parent Schema" onClick={createSchema} />
          </div>
        </div>
      {/if}
    </div>
    <div class="mt-2">
      <ActionButton label="Print Schemas" onClick={evaluateSchemas} />
    </div>
    <div class="mt-2">
      <ActionButton label="Save Schemas" onClick={saveSchemas} />
    </div>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .glow-border {
    box-shadow:
      0 0 15px rgba(59, 130, 246, 0.5),
      0 0 5px rgba(59, 130, 246, 0.3),
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
</style>
