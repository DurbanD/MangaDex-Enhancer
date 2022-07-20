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
    static name = ''
    static dataMap = new Map()
    static port = null
    constructor(name) {
        if (BackgroundHandler.name !== '') throw Error('BackgroundHandler already exists')
        this.name = name
        BackgroundHandler.name = this.name
        this.port = BackgroundHandler.port
        this.dataMap = BackgroundHandler.dataMap
    }

    setContainers(view) {
        for (let card of view.cards) {
            let id = view.getCardID(card)
            if (this.dataMap.has(id)) this.dataMap.get(id).container = card
            else this.dataMap.set(id, new MangaInfo(card, null, null))
        }
        console.log(this.dataMap)
    }

    listenForConnectionMessages () {
        if (!this.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        this.port.onMessage.addListener(function(msg, sender) {
            
            if (msg.type === 'idGet_Response') {
                console.log('idGet response recieved. \n', msg)
                    for (let res of msg.body.data) {
                        if (BackgroundHandler.dataMap.has(res.id)) BackgroundHandler.dataMap.get(res.id).fullInfo = res
                        else BackgroundHandler.dataMap.set(res.id, new MangaInfo(null, res, null))
                    }
                console.log(BackgroundHandler.dataMap)
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
        Handler.setContainers(V)
        Handler.idLookup([...Handler.dataMap.keys()])
        console.log(Handler)
        // console.log(V.viewMap)
    }
}).observe(document, {subtree: true, childList: true})
