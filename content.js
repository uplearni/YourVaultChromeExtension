const auth = localStorage.getItem("auth-storage");

if (auth) {
  try {
    const token = JSON.parse(auth)?.state?.token;
    if (token) {
      window.postMessage(
        {
          source: "COLLECTION_EXTENSION",
          type: "SET_TOKEN",
          token: token,
        },
        "*"
      );
    }
  } catch (err) {
    console.error("Failed to parse auth-storage", err);
  }
}

window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    !event.data ||
    event.data.source !== "COLLECTION_EXTENSION"
  ) {
    return;
  }

  if (event.data.type === "SET_TOKEN") {
    chrome.runtime.sendMessage({
      type: "FORWARD_TOKEN_TO_EXTENSION",
      token: event.data.token,
    });
  }
});
