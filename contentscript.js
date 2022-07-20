class MangaInfo {
    constructor(container, fullInfo, userInfo) {
        this.container = container
        this.fullInfo = fullInfo
        this.userInfo = userInfo
    }
}

class View {
    constructor() {
        this.cards = document.querySelectorAll('.manga-card')
        this.viewMap = new Map()
    }

    updateSeenCards() {
        this.cards = document.querySelectorAll('.manga-card')
    }

    getCardID(card) {
        let href = card.querySelector('a').href,
            id = href.match(/(?<=title\/)[A-Za-z0-9-]+/)
        return id[0]
    }

    setViewMap() {
        for (let card of this.cards) {
            let id = this.getCardID(card)
            this.viewMap.set(id, new MangaInfo(card, null, null))
        }
    }

    setViewMapApiInfo(handler) {
        handler.idLookup([...this.viewMap.keys()])
        for (let key of this.viewMap.keys()) {

        }
    }
}

class BackgroundHandler {

    constructor(name) {
        this.name = name
        this.port = null
    }

    listenForConnectionMessages (view=null) {
        if (!this.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        this.port.onMessage.addListener(function(msg, sender) {
            
            if (msg.type === 'idGet_Response') {
                console.log('idGet response recieved. \n', msg)
                if (view) {
                    for (let res of msg.body.data) {
                        if (view.viewMap.has(res.id)) view.viewMap.get(res.id).fullInfo = res
                        else view.viewMap.set(res.id, new MangaInfo(null, res, null))
                    }
                }
            }
          });
    }
    openConnection() {
        this.port = chrome.runtime.connect({name: this.name})
        return this.port

    }
    listenForMessages () {
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
              console.log(sender);
            }
        );
    }

    idLookup(ids) {
        this.port.postMessage({type:'idGet', idList:ids});
    }

    connect() {
        this.openConnection()
        this.listenForConnectionMessages()
        this.listenForMessages()
        return this.port
    }
}

let Handler = new BackgroundHandler('API_Controller')
let V = new View()

Handler.connect()

new MutationObserver(()=> {
    const newCards = document.querySelectorAll('.manga-card')
    if (V.cards[0] !== newCards[0]) {
        V.updateSeenCards()
        V.setViewMap()
        Handler.idLookup([...V.viewMap.keys()])
        console.log(V.viewMap)
    }
}).observe(document, {subtree: true, childList: true})
