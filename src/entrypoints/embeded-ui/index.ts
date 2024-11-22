// entrypoints/example-ui.content/index.ts
import { mount } from "svelte";
import App from "./App.svelte";

export default defineContentScript({
  matches: ["*://*.google.com/*"],

  main(ctx) {
    console.log("Hello embeded-ui.");
    const ui = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        // Create the Svelte app inside the UI container
        const app = mount(App, {
          target: container,
        });
        return app;
      },
    });

    // Call mount to add the UI to the DOM
    ui.mount();
  },
});
