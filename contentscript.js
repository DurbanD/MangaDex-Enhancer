class View {
    constructor() {
        let cards = document.querySelectorAll('.manga-card')
    }
}


// Send Messages to background.js
// chrome.runtime.sendMessage({type: "getName"}, function(response) {
//     console.log('getName Response: ', response);
// });

let openPort = function() {
    let name, port
    chrome.runtime.sendMessage({type: "getName"}, function(response) {
        name = response.msg
    });
    port = chrome.runtime.connect({name:name})
    return port
}
let port = openPort()
// Setup a connection to background.js to request and recieve async api calls
// let port = chrome.runtime.connect({name: "API_Controller"});
// Handle recieved messages
port.onMessage.addListener(function(msg) {
  console.log(msg)
});
console.log(port)

port.postMessage({type:'idGet', idList:['371bb8db-b84a-495e-bdb6-a744da3c2f5e']});
// port.postMessage({type:'lookupHistory'});

// Handle recieving messages from background.js (Sync)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender);
    }
);