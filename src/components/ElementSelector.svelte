<script lang="ts">
  interface Props {
    element: HTMLElement | null;
    onSelect: () => void;
    onNavigate: (direction: "parent" | "child") => void;
    onHover: (isHovering: boolean) => void;
  }

  let { element, onSelect, onNavigate, onHover }: Props = $props();
</script>

<div class="flex-1 flex items-center gap-2">
  <button
    class="px-2 opacity-50 hover:opacity-100 transition-opacity disabled:opacity-25"
    onclick={() => onNavigate("parent")}
    disabled={!element}
    title="Select parent element"
  >
    ↑
  </button>
  <button
    class={`
      flex-1 text-sm text-inherit/90 bg-black/10 border rounded px-2 py-1 cursor-pointer
      ${element ? "border-black/10" : "border-blue-400/40 border-2 border-dashed"}
    `}
    onclick={onSelect}
    onmouseenter={() => onHover(true)}
    onmouseleave={() => onHover(false)}
  >
    {element ? element.tagName : "Click to select element"}
  </button>
  <button
    class="px-2 opacity-50 hover:opacity-100 transition-opacity disabled:opacity-25"
    onclick={() => onNavigate("child")}
    disabled={!element}
    title="Select child element"
  >
    ↓
  </button>
</div>
