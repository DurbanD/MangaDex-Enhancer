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
        Controller.name = name
        this.name = Controller.name
        this.port = Controller.port
        this.dataMap = Controller.dataMap
        this.authTokens = {
            session:null,
            refresh:null
        }
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

            switch (msg.type){
                case "idGet_Response":
                    // console.log('idGet response recieved. \n', msg)
                    if (msg.body.result !== "ok") throw Error('idGet Failed: \n', msg)
                    else {
                        for (let res of msg.body.data) {
                            if (Controller.dataMap.has(res.id)) Controller.dataMap.get(res.id).fullInfo = res
                            else Controller.dataMap.set(res.id, new MangaInfo(null, res, null))
                        }
                    } 
                    break
                case "chapterGet_Response":
                    console.log(msg)
                    break
                case "readGet_Response":
                    console.log(msg)    
                    break
                case "login_Response":
                    console.log(msg)
                    break
                case 'checkAuth_Response':
                    console.log(msg)
                    break
                default: 
                    console.log(msg)
                    break
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

    sendMessage(type, body) {
        if (!this.port) this.connect()
        this.port.postMessage({type: type, body:body});
    }

    connect() {
        this.openConnection()
        this.listenForConnectionMessages()
        this.listenForMessages()
    }

    updateDataMap(view=null) {
        if (view) this.setContainers(view)
        let newManga = []
        for (let key of this.dataMap.keys()) if (this.dataMap.get(key).fullInfo === null) newManga.push(key)
        this.sendMessage('idGet', { idList: newManga})
        // this.sendMessage('chapterGet', { idList: newManga})
        // this.sendMessage('readGet', { idList: newManga})
    }

    getTokens(view) {
        let session = view.getCookie('auth._token.local'),
        refresh = view.getCookie('auth._refresh_token.local')

        return {
            session: session,
            refresh: refresh
        }
    }

    setTokens(tokens) {
        this.authTokens = {
            session : tokens.session,
            refresh : tokens.refresh
        }
    }
}