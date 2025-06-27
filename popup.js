document.addEventListener("DOMContentLoaded",async()=>{
    const collectionSelect=document.getElementById("collectionSelect")
    const saveBtn=document.getElementById("saveBtn");
    const status=document.getElementById("status");

    let [tab]=await chrome.tabs.query({active:true,currentWindow:true})
    const title = tab.title;
    const url=tab.url;

    chrome.storage.local.get("token",async({token})=>{
      if(!token){
        status.innerText="Please visit your web app and login first"
        return;
      }

      try{
        const res=await fetch("http://localhost:3000/api/collection/",{
            headers:{
                Authorization:`Bearer ${token}`,
            },
        });

        const collection=await res.json();
        const data=collection.collection || [];
       console.log(" Full collection response:", collection);

        data.forEach((col)=>{
            const option=document.createElement("option");
            option.value=col._id;
            option.textContent=col.cname;
            collectionSelect.appendChild(option);
        });


        saveBtn.onclick=async()=>{
            const selectedCollectionId=collectionSelect.value;

            const saveRes=await fetch("http://localhost:3000/api/item/",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`,
                },

                body: JSON.stringify({
                type: "url",
                title,
                url,
                description: "", // You can later let users add this
                collectionId:selectedCollectionId    
            }),
            }); 

            if(saveRes.ok){
                status.innerText="Saved!";
            }else{
                status.innerText="Failed to save";
            }
            };
        }catch(err){
            console.log(err);
            status.innerText="Error Fetching Collections"
        }
      });
    }
    );