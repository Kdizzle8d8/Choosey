<script lang="ts">
  import svelteLogo from "../../assets/svelte.svg";
</script>

<main
  class="flex flex-col items-center p-8 min-w-[320px] max-w-[1280px] mx-auto text-center"
>
  <div class="flex gap-8 items-center">
    <a href="https://wxt.dev" target="_blank" rel="noreferrer">
      <img
        src="/wxt.svg"
        class="h-24 p-6 transition-all hover:drop-shadow-[0_0_2em_#54bc4ae0]"
        alt="WXT Logo"
      />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img
        src={svelteLogo}
        class="h-24 p-6 transition-all hover:drop-shadow-[0_0_2em_#ff3e00aa]"
        alt="Svelte Logo"
      />
    </a>
  </div>
  <h1 class="text-4xl font-bold my-4">WXT + Svelte</h1>

  <div class="p-8"></div>

  <p class="text-gray-400">Click on the WXT and Svelte logos to learn more</p>
</main>
