document.addEventListener("DOMContentLoaded", async () => {
  const collectionSelect = document.getElementById("collectionSelect");
  const saveBtn = document.getElementById("saveBtn");
  const statusText = document.getElementById("status");
  const createCollectionBtn = document.getElementById("createCollectionBtn");
  const newCollectionInput = document.getElementById("newCollectionName");
  const loading = document.getElementById("loading");

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const title = tab.title;
  const url = tab.url;

  chrome.storage.local.get("token", async ({ token }) => {
    if (!token) {
      statusText.innerText = "Please visit your web app and login first";
      return;
    }

    try {
      loading.style.display = "block";
      const res = await fetch("http://localhost:3000/api/collection/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loading.style.display = "none";

      const response = await res.json();
      const data = response.collection || [];

      console.log("Full collection response:", response);

      data.forEach((col) => {
        const option = document.createElement("option");
        option.value = col._id;
        option.textContent = col.cname;
        collectionSelect.appendChild(option);
      });

      saveBtn.onclick = async () => {
        const selectedCollectionId = collectionSelect.value;

        loading.style.display = "block";
        const itemsRes = await fetch(`http://localhost:3000/api/item?collectionId=${selectedCollectionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const itemsData = await itemsRes.json();
        const items = itemsData.data || [];

        const alreadyExists = items.some(item => item.url === url);
        if (alreadyExists) {
          statusText.innerText = "⚠️ Page already saved in this collection";
          loading.style.display = "none";
          return;
        }

        const saveRes = await fetch("http://localhost:3000/api/item", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "url",
            title,
            url,
            description: "",
            collectionId: selectedCollectionId,
          }),
        });

        loading.style.display = "none";

        if (saveRes.ok) {
          statusText.innerText = "✅ Page saved";
        } else {
          statusText.innerText = "❌ Failed to save page";
        }
      };

      createCollectionBtn.onclick = async () => {
        const cname = newCollectionInput.value.trim();
        if (!cname) {
          statusText.innerText = "Collection name is required";
          return;
        }

        loading.style.display = "block";
        const createRes = await fetch("http://localhost:3000/api/collection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cname, description: "" }),
        });
        loading.style.display = "none";

        if (!createRes.ok) throw new Error("Failed to create collection");
        const { data } = await createRes.json();

        const saveRes = await fetch("http://localhost:3000/api/item", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "url",
            title,
            url,
            description: "",
            collectionId: data.id,
          }),
        });

        if (!saveRes.ok) throw new Error("Failed to save page");

        statusText.innerText = `✅ Page saved to "${data.collection}"`;
        newCollectionInput.value = "";
      };

      const screenshotBtn = document.getElementById("screenshotBtn");

      screenshotBtn.onclick = async () => {
        statusText.innerText = "Capturing Screenshot";
        loading.style.display = "block";

        try {
          // 1. Capture visible tab
          const imageUri = await chrome.tabs.captureVisibleTab();

          // 2. Convert to Blob
          const blob = await (await fetch(imageUri)).blob();

          // 3. Ask which collection to save in
          const selectedCollectionId = collectionSelect.value;
          if (!selectedCollectionId) {
            statusText.innerText = "⚠️ Please select a collection first";
            loading.style.display = "none";
            return;
          }

          const formData = new FormData();
          formData.append("type", "file");
          formData.append("title", `Screenshot - ${title}`);
          formData.append("description", "Screenshot from extension");
          formData.append("collectionId", selectedCollectionId);
          formData.append("file", blob, `${title.slice(0, 20)}.png`);

          const uploadRes = await fetch("http://localhost:3000/api/item", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadRes.ok) {
            statusText.innerText = "✅ Screenshot saved!";
          } else {
            statusText.innerText = "❌ Failed to upload screenshot";
          }
        } catch (err) {
          console.error(err);
          statusText.innerText = "❌ Error capturing screenshot";
        } finally {
          loading.style.display = "none";
        }
      };

    } catch (err) {
      console.error(err);
      loading.style.display = "none";
      statusText.innerText = "⚠️ Error fetching collections";
    }
  });
});
