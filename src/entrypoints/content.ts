// 1. Import the style
import "./popup/app.css";
import App from "./embeded-ui/App.svelte";
import { mount } from "svelte";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "example-ui",
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        const app = mount(App, {
          target: container,
        });
        return app;
      },
    });

    ui.mount();
  },
});
