<script lang="ts">
  interface Props {
    element: HTMLElement | null;
    onSelect: () => void;
    onNavigate: (direction: "parent" | "child") => void;
    onHover: (isHovering: boolean) => void;
  }

  let {
    element,
    onSelect,
    onNavigate,
    onHover,
    class: className = "",
  } = $props();
</script>

<div class="flex flex-1 w-full flex-col gap-1">
  <label class="text-xs text-inherit/70">Element</label>
  <div class="flex gap-1">
    <button
      class="flex-1 px-2 py-1 text-left rounded text-sm bg-black/10 border border-black/10 truncate {className}"
      onclick={onSelect}
      onmouseenter={() => onHover(true)}
      onmouseleave={() => onHover(false)}
    >
      {#if element}
        {element.tagName.toUpperCase()}
      {:else}
        Select element...
      {/if}
    </button>
    <div class="flex gap-1">
      <button
        class="px-2 py-1 rounded text-sm bg-black/10 border border-black/10 hover:bg-black/20"
        onclick={() => onNavigate("parent")}
        title="Select parent element"
      >
        ↑
      </button>
      <button
        class="px-2 py-1 rounded text-sm bg-black/10 border border-black/10 hover:bg-black/20"
        onclick={() => onNavigate("child")}
        title="Select child element"
      >
        ↓
      </button>
    </div>
  </div>
</div>
