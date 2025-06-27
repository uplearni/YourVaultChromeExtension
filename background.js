chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FORWARD_TOKEN_TO_EXTENSION") {
    chrome.storage.local.set({ token: msg.token }, () => {
      console.log("✅ Token stored from page script");
      sendResponse({ success: true });
    });
    return true;
  }
});

// Listen for token from web page via content script bridge
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.type === "SET_TOKEN") {
      chrome.storage.local.set({ token: msg.token }, () => {
        console.log("✅ Token saved from connect");
      });
    }
  });
});
