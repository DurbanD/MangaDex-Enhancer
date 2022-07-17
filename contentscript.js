class View {
    constructor() {
        let cards = document.querySelectorAll('.manga-card')
    }
}

// Handle recieved messages
let listenForConnectionMessages = function(port) {
    port.onMessage.addListener(function(msg) {
        console.log(`Message Recieved over port ${port.name}: \n`, msg)
      });
}

let openConnection = function() {
    let name, port
    chrome.runtime.sendMessage({type: "getName"}, function(response) {
        name = response.msg
    });
    port = chrome.runtime.connect({name:name})

    return port
}

// Handle recieving messages from background.js (Sync)
let listenForMessages = function () {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          console.log(sender);
        }
    );
}

let connect = function () {
    let port = openConnection()
    listenForConnectionMessages(port)
    listenForMessages()
    return port
}
let port = connect()
port.postMessage({type:'idGet', idList:['371bb8db-b84a-495e-bdb6-a744da3c2f5e']});
