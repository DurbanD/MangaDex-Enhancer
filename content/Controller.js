class MangaInfo {
    constructor(container, fullInfo, userInfo) {
        this.container = container
        this.fullInfo = fullInfo
        this.userInfo = userInfo
    }
}

export default class Controller {
    static name = ''
    static dataMap = new Map()
    static port = null
    constructor(name) {
        if (Controller.name !== '') throw Error('Content Controller already exists')
        this.name = name
        Controller.name = this.name
        this.port = Controller.port
        this.dataMap = Controller.dataMap
    }

    setContainers(view) {
        for (let card of view.cards) {
            let id = view.getCardID(card)
            if (this.dataMap.has(id)) this.dataMap.get(id).container = card
            else this.dataMap.set(id, new MangaInfo(card, null, null))
        }
    }

    listenForConnectionMessages () {
        if (!this.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        this.port.onMessage.addListener(function(msg, sender) {
            
            if (msg.type === 'idGet_Response') {
                console.log('idGet response recieved. \n', msg)
                if (msg.body.result !== "ok") throw Error('idGet Failed: \n', msg)
                else {
                    for (let res of msg.body.data) {
                        if (Controller.dataMap.has(res.id)) Controller.dataMap.get(res.id).fullInfo = res
                        else Controller.dataMap.set(res.id, new MangaInfo(null, res, null))
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
        if (!this.port) this.connect()
        this.port.postMessage({type:'idGet', idList:ids});
    }

    connect() {
        this.openConnection()
        this.listenForConnectionMessages()
        this.listenForMessages()
    }
}