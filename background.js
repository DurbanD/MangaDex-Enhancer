const apiURL = 'https://api.mangadex.org'

// Searches for manga by ids and returns all results
const getMangaByID = async function(limit, offset, idList=[]) {
    let query = `/manga?limit=${limit}&offset=${offset}`
    for (let id of idList) query += `&ids[]=${id}`
    
    let mangaList = await fetch(apiURL+query).then(res=>res.json()).then(data=>data)

    return mangaList
}

// Listens for and handles messages from contentscripts
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    console.log(sender, request);
    sendResponse({msg:`background.js recieved a message from ${sender.id}`})
  }
);

// Listens for and handles the api control from contentscripts
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "api_control");
  
  port.onMessage.addListener(async function(msg) {
    
    if (msg.type === "idGet") {
      let mangaList = await getMangaByID(100, 0, msg.idList)
      port.postMessage(mangaList);
    }
  
  });
});