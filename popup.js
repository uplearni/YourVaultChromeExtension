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
    const items = itemsData.items || [];
    
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
    } catch (err) {
      console.error(err);
      loading.style.display = "none";
      statusText.innerText = "⚠️ Error fetching collections";
    }
  });
});
