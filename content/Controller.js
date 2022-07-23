class MangaInfo {
    constructor(container, fullInfo, userInfo) {
        this.container = container
        this.fullInfo = fullInfo
        this.userInfo = {
            read: userInfo.read || [],
            rating: userInfo.rating || null
        }
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

    static sendMessage(type, body) {
        if (!Controller.port) Controller.connect()
        Controller.port.postMessage({type: type, body:body});
    }

    sendMessage(type, body) {
        Controller.sendMessage(type,body)
    }

    setContainers(view) {
        for (let card of view.cards) {
            let id = view.getCardID(card)
            if (this.dataMap.has(id)) this.dataMap.get(id).container = card
            else this.dataMap.set(id, new MangaInfo(card, null, {read:[], rating:null}))
        }
    }

    static listenForConnectionMessages () {
        if (!Controller.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        Controller.port.onMessage.addListener(function(msg, sender) {

            switch (msg.type){
                case "get_manga_response":
                    if (msg.body.result !== "ok") throw Error('get_manga Failed: \n', msg)
                    else {
                        for (let res of msg.body.data) {
                            if (Controller.dataMap.has(res.id)) Controller.dataMap.get(res.id).fullInfo = res
                            else Controller.dataMap.set(res.id, new MangaInfo(null, res, {read:[], rating:null}))
                        }
                    } 
                    break
                case 'get_rating_response':
                    for (let id of Object.keys(msg.body.ratings)) {
                        if (Controller.dataMap.has(id)) Controller.dataMap.get(id).userInfo.rating = msg.body.ratings[id].rating
                        else Controller.dataMap.set(id, new MangaInfo(null,null, {read: null, rating:null}))
                    }
                    console.log(msg)
                    break
                case 'get_read_response':
                    if (msg.body.result !== "ok") throw Error('get_read failed! \n', msg)
                    else {
                        let readChapters = msg.body.data
                        console.log(msg)
                        while (readChapters.length > 0) Controller.sendMessage('get_chapter', {idList: readChapters.splice(0,100)})
                    }
                    break
                case 'get_chapter_response':
                    if (msg.body.result !== "ok") throw Error('get_chapter Failed: \n', msg)
                    else {
                        for (let res of msg.body.data) {
                            let id = ''
                            for (let relationship of res.relationships) if (relationship.type === 'manga') id = relationship.id
                            if (Controller.dataMap.has(id)) Controller.dataMap.get(id).userInfo.read.push(res)
                            else Controller.dataMap.set(id, new MangaInfo(null,null, {read: res, rating:null}))
                        }
                    }
                    break
                case "login_Response":
                    console.log(msg)
                    break
                case 'get_auth_Response':
                    console.log(msg)
                    break
                default: 
                    console.log(msg)
                    break
            }
          });
    }

    static openConnection() {
        this.port = chrome.runtime.connect({name: this.name})
        return this.port

    }
    static listenForMessages () {
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
              console.log(sender);
            }
        );
    }

    static connect() {
        Controller.openConnection()
        Controller.listenForConnectionMessages()
        Controller.listenForMessages()
    }

    connect() {
        return Controller.connect()
    }

    updateDataMap(view) {
        let newManga = []
        this.setContainers(view)
        this.setTokens(this.getTokens(view))

        for (let key of this.dataMap.keys()) if (this.dataMap.get(key).fullInfo === null) newManga.push(key)

        Controller.sendMessage('get_manga', { idList: newManga})
        if (this.authTokens.session !== null) {
            Controller.sendMessage('get_read', { idList: newManga, token: this.authTokens.session})
            Controller.sendMessage('get_rating', { idList: newManga, token: this.authTokens.session})
        }
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