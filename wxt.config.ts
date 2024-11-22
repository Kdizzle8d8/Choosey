import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    permissions: ["storage"],
    commands: {
      "toggle-ui": {
        suggested_key: {
          default: "Ctrl+Shift+E",
        },
        description: "Toggle the UI",
      },
    },
  },
});
