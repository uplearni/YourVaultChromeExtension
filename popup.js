document.addEventListener("DOMContentLoaded", async () => {
  const collectionSearch = document.getElementById("collectionSearch");
  const datalist = document.getElementById("collectionOptions");
  const saveBtn = document.getElementById("saveBtn");
  const statusText = document.getElementById("status");
  const createUrlBtn = document.getElementById("createUrlCollectionBtn");
  const createScreenshotBtn = document.getElementById("createScreenshotCollectionBtn");
  const newCollectionInput = document.getElementById("newCollectionName");
  const screenshotBtn = document.getElementById("screenshotBtn");
  const loading = document.getElementById("loading");

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const title = tab.title;
  const url = tab.url;
  let collectionsData = [];

  function getSelectedCollectionId() {
    const selectedName = collectionSearch.value.trim();
    const found = collectionsData.find((c) => c.cname === selectedName);
    return found ? found._id : null;
  }

  async function saveUrlToCollection(collectionId, token) {
    const itemsRes = await fetch(`https://yourvault.onrender.com/api/item?collectionId=${collectionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const itemsData = await itemsRes.json();
    const items = itemsData.data || [];
    const alreadyExists = items.some(item => item.url === url);
    if (alreadyExists) return { ok: false, message: "Page already saved in this collection" };

    const saveRes = await fetch("https://yourvault.onrender.com/api/item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "url", title, url, description: "", collectionId }),
    });

    if (!saveRes.ok) return { ok: false, message: " Failed to save page" };
    return { ok: true, message: "Page saved" };
  }

  async function saveScreenshotToCollection(collectionId, token) {
    const imageUri = await chrome.tabs.captureVisibleTab();
    const blob = await (await fetch(imageUri)).blob();

    const formData = new FormData();
    formData.append("type", "file");
    formData.append("title", `Ss - ${title}`);
    formData.append("description", "Screenshot from extension");
    formData.append("collectionId", collectionId);
    formData.append("file", blob, `${title.slice(0, 20)}.png`);

    const res = await fetch("https://yourvault.onrender.com/api/item", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    return res.ok;
  }

  chrome.storage.local.get("token", async ({ token }) => {
    if (!token) {
      statusText.innerText = "Please visit your web app and login first";
      return;
    }

    try {
      loading.style.display = "block";
      const res = await fetch("https://yourvault.onrender.com/api/collection/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      loading.style.display = "none";

      const response = await res.json();
      collectionsData = response.collection || [];

      datalist.innerHTML = "";
      collectionsData.forEach((col) => {
        const option = document.createElement("option");
        option.value = col.cname;
        datalist.appendChild(option);
      });

      saveBtn.onclick = async () => {
        const selectedCollectionId = getSelectedCollectionId();
        if (!selectedCollectionId) {
          statusText.innerText = "Invalid collection selected";
          return;
        }
        loading.style.display = "block";
        const result = await saveUrlToCollection(selectedCollectionId, token);
        statusText.innerText = result.message;
        loading.style.display = "none";
      };

      screenshotBtn.onclick = async () => {
        const selectedCollectionId = getSelectedCollectionId();
        if (!selectedCollectionId) {
          statusText.innerText = " Invalid collection selected";
          return;
        }
        loading.style.display = "block";
        const ok = await saveScreenshotToCollection(selectedCollectionId, token);
        statusText.innerText = ok
          ? " Screenshot saved!"
          : " Failed to save screenshot";
        loading.style.display = "none";
      };

      createUrlBtn.onclick = async () => {
        const cname = newCollectionInput.value.trim();
        if (!cname) {
          statusText.innerText = "Collection name is required";
          return;
        }

        loading.style.display = "block";
        const createRes = await fetch("https://yourvault.onrender.com/api/collection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cname, description: "" }),
        });

        if (!createRes.ok) {
          statusText.innerText = "Failed to create collection";
          loading.style.display = "none";
          return;
        }

        const { data } = await createRes.json();
        const result = await saveUrlToCollection(data.id, token);
        statusText.innerText = result.message;
        newCollectionInput.value = "";
        loading.style.display = "none";
      };

      createScreenshotBtn.onclick = async () => {
        const cname = newCollectionInput.value.trim();
        if (!cname) {
          statusText.innerText = "Collection name is required";
          return;
        }

        loading.style.display = "block";
        const createRes = await fetch("https://yourvault.onrender.com/api/collection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cname, description: "" }),
        });

        if (!createRes.ok) {
          statusText.innerText = "Failed to create collection";
          loading.style.display = "none";
          return;
        }

        const { data } = await createRes.json();
        const ok = await saveScreenshotToCollection(data.id, token);
        statusText.innerText = ok
          ? `Screenshot saved to "${data.collection}"`
          : "Failed to save screenshot";
        newCollectionInput.value = "";
        loading.style.display = "none";
      };
    } catch (err) {
      console.error(err);
      loading.style.display = "none";
      statusText.innerText = "Error fetching collections";
    }
  });
});
