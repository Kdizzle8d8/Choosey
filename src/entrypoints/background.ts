export default defineBackground(() => {
  // Listen for the command
  chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-ui") {
      // Send message to all tabs
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggle-ui" });
        }
      });
    }
  });
});
