class Manga {
    constructor(id, container = null) {
        this.id = id
        this.container = container
        this.info = null
        this.user = {
            read : [],
            rating: null
        }
        this.aggregate = null
        this.newestChapter = 0
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
                        // console.log(msg)
                        for (let res of msg.body.data) {
                            if (Controller.dataMap.has(res.id)) Controller.dataMap.get(res.id).info = res
                        }
                    } 
                    break
                case 'get_rating_response':
                    if (!msg.body) break
                    if (msg.body.result === "ok") {
                        for (let id of Object.keys(msg.body.ratings)) {
                            let mangaRating = msg.body.ratings[id].rating
                            if (Controller.dataMap.has(id)) Controller.dataMap.get(id).user.rating = mangaRating
                        }
                    }                    
                    break
                case 'get_read_response':
                    if (msg.body === null) break
                    if (msg.body.result === "ok") {
                        let readChapters = msg.body.data
                        while (readChapters.length > 0) Controller.sendMessage('get_chapter', {idList: readChapters.splice(0,100)})
                    }
                    break
                case 'get_chapter_response':
                    if (msg.body === null) break
                    if (msg.body.result === "ok") {
                        for (let res of msg.body.data) {
                            let id = ''
                            for (let relationship of res.relationships) if (relationship.type === 'manga') {
                                id = relationship.id
                                if (Controller.dataMap.has(id)) Controller.dataMap.get(id).user.read.push(res)
                            }
                        }
                    }
                    break
                case 'get_aggregate_response' :
                    if (!msg.body) break
                    if (msg.body.result === "ok") {
                        if (Controller.dataMap.has(msg.body.manga_id)) {
                            Controller.dataMap.get(msg.body.manga_id).aggregate = msg.body.volumes
                            for (let vol of Object.values(msg.body.volumes)) {
                                for (let ch of Object.values(vol.chapters)) {
                                    if (parseFloat(ch.chapter) > Controller.dataMap.get(msg.body.manga_id).newestChapter) Controller.dataMap.get(msg.body.manga_id).newestChapter = parseFloat(ch.chapter)
                                }
                            }
                        }
                    }
                    break
                case "login_Response":
                    break
                case 'get_auth_Response':
                    console.log(msg)
                    break
                case 'get_user_response':
                    Controller.user.account = msg.body.data
                    break
                case 'get_user_settings_response':
                    Controller.user.settings = msg.body.data
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

        if (newManga.length > 0) {
            Controller.sendMessage('get_manga', { idList: newManga})
            Controller.sendMessage('get_read', { idList: newManga, token: this.authTokens.session})
            Controller.sendMessage('get_rating', { idList: newManga, token: this.authTokens.session})
            for (let manga of newManga) {
                Controller.sendMessage('get_aggregate', {id: manga, language:['en']})
            }
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
        this.setTokens(this.getTokens(view))
        view.updateSeenCards()
        this.updateDataMap(view)
        if (!this.user.account) this.setUser()
    }
}