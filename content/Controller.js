class Manga {
    constructor(id, container = null) {
        this.id = id
        this.container = container
        this.info = null
        this.user = {
            read : [],
            rating: null
        }
    }
}

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
    static user = {
        account: null,
        settings: null
    }
    constructor(name) {
        if (Controller.name !== '') throw Error('Content Controller already exists')
        Controller.name = name
        this.name = Controller.name
        this.port = Controller.port
        this.dataMap = Controller.dataMap
        this.authTokens = {
            session:null,
            refresh:null
        },
        this.user = Controller.user
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
            if (Controller.dataMap.has(id)) Controller.dataMap.get(id).container = card
            // else this.dataMap.set(id, new MangaInfo(card, null, {read:[], rating:null}))
            else Controller.dataMap.set(id, new Manga(id, card))
        }
    }

    static listenForConnectionMessages () {
        if (!Controller.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        Controller.port.onMessage.addListener(function(msg, sender) {

            switch (msg.type){
                case "get_manga_response":
                    if (msg.body === null) break
                    if (msg.body.result === "ok") {
                        console.log(msg)
                        for (let res of msg.body.data) {
                            if (Controller.dataMap.has(res.id)) Controller.dataMap.get(res.id).info = res
                            // else {
                            //     let newManga = new Manga(res.id)
                            //     newManga.info = res
                            //     Controller.dataMap.set(res.id, newManga)
                            // }
                            // if (Controller.dataMap.has(res.id)) Controller.dataMap.get(res.id).fullInfo = res
                            // else Controller.dataMap.set(res.id, new MangaInfo(null, res, {read:[], rating:null}))
                        }
                    } 
                    break
                case 'get_rating_response':
                    if (!msg.body) break
                    if (msg.body.result === "ok") {
                        for (let id of Object.keys(msg.body.ratings)) {
                            let mangaRating = msg.body.ratings[id].rating
                            if (Controller.dataMap.has(id)) Controller.dataMap.get(id).user.rating = mangaRating
                            // else {
                            //     let newManga = new Manga(id)
                            //     newManga.user.rating = mangaRating
                            //     Controller.dataMap.set(id, newManga)
                            // }
                            // if (Controller.dataMap.has(id)) Controller.dataMap.get(id).userInfo.rating = msg.body.ratings[id].rating
                            // else Controller.dataMap.set(id, new MangaInfo(null,null, {read: null, rating:msg.body.ratings[id].rating}))
                        }
                    }                    
                    break
                case 'get_read_response':
                    if (msg.body === null) break
                    console.log(msg)
                    if (msg.body.result === "ok") {
                        let readChapters = msg.body.data
                        while (readChapters.length > 0) Controller.sendMessage('get_chapter', {idList: readChapters.splice(0,100)})
                    }
                    break
                case 'get_chapter_response':
                    if (msg.body === null) break
                    console.log(msg)
                    if (msg.body.result === "ok") {
                        for (let res of msg.body.data) {
                            let id = ''
                            for (let relationship of res.relationships) if (relationship.type === 'manga') {
                                id = relationship.id
                                if (Controller.dataMap.has(id)) Controller.dataMap.get(id).user.read.push(res)
                                // else {
                                //     let newManga = new Manga(id)
                                //     newManga.user.read = [res]
                                //     Controller.dataMap.set(id, newManga)
                                // }
                            }
                            // if (Controller.dataMap.has(id)) Controller.dataMap.get(id).userInfo.read.push(res)
                            // else Controller.dataMap.set(id, new MangaInfo(null,null, {read: [res], rating:null}))
                        }
                    }
                    break
                case "login_Response":
                    console.log(msg)
                    break
                case 'get_auth_Response':
                    console.log(msg)
                    break
                case 'get_user_response':
                    console.log(msg)
                    Controller.user.account = msg.body.data
                    break
                case 'get_user_settings_response':
                    Controller.user.settings = msg.body.data
                    console.log(msg)
                    break
                default: 
                    console.log(msg)
                    break
            }
          });
    }

    static openConnection() {
        Controller.port = chrome.runtime.connect({name: Controller.name})
        Controller.port.onDisconnect.addListener(()=> Controller.port = null)
        return Controller.port

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
        Controller.connect()
        this.port = Controller.port
    }

    updateDataMap(view) {
        let newManga = []
        this.setContainers(view)
        this.setTokens(this.getTokens(view))

        for (let key of this.dataMap.keys()) if (this.dataMap.get(key).info === null) newManga.push(key)

        if (newManga.length > 0) Controller.sendMessage('get_manga', { idList: newManga})
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

    setUser() {
        if (!this.authTokens.session) throw Error('No user to set in Controller.setUser()')
        Controller.sendMessage('get_user', { userID: 'me', token: this.authTokens.session })
        Controller.sendMessage('get_user_settings', { token: this.authTokens.session })
    }

    refresh(view) {
        if (!this.port) this.connect()
        view.updateSeenCards()
        this.updateDataMap(view)
        this.setTokens(this.getTokens(view))
        if (!this.user.account) this.setUser()
    }
}