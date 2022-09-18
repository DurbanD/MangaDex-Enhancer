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
        this.newestRead = 0
    }
}

export default class Controller {
    static dataMap = new Map()
    static port = null
    static user = {
        account: null,
        settings: null
    }
    static active = null
    constructor(name) {
        if (Controller.active) throw Error('Content Controller already exists')
        this.name = name
        this.port = Controller.port
        this.dataMap = Controller.dataMap
        this.view = null
        this.auth = {
            session:null,
            refresh:null
        },
        this.user = Controller.user
        Controller.active = this
    }

    setView(view) {
        this.view = view
    }

    static sendMessage(type, body) {
        if (!Controller.port) Controller.connect()
        Controller.port.postMessage({type: type, body:body});
    }

    static getActive() {
        if (!Controller.active) new Controller('')
        return Controller.active
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
            let activeController = Controller.getActive()
            if (!msg.body) return
            if (msg.body.result === 'error') {
                activeController.sendMessage('check_auth')
            }
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
                            if (Controller.dataMap.has(id)) {
                                Controller.dataMap.get(id).user.rating = mangaRating
                                Controller.dataMap.get(id).container.querySelector('.mdp_rank').innerText = mangaRating
                                Controller.dataMap.get(id).container.querySelector('.rank_flair').innerText = '🌟'
                            }
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
                                if (Controller.dataMap.has(id)) { 
                                    Controller.dataMap.get(id).user.read.push(res)
                                    Controller.dataMap.get(id).newestRead = Math.max(Controller.dataMap.get(id).newestRead, parseFloat(res.attributes.chapter))
                                    Controller.dataMap.get(id).container.querySelector('.chapter_counter_read_mdp').innerText = Controller.dataMap.get(id).newestRead
                                }
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
                            Controller.dataMap.get(msg.body.manga_id).container.querySelector('.chapter_counter_available_mdp').innerText = Controller.dataMap.get(msg.body.manga_id).newestChapter
                        }
                    }
                    break
                case 'check_auth_response':
                    if (!msg.body.isAuthenticated) Controller.sendMessage('refresh_token')
                    console.log(msg)
                    break
                case 'get_user_response':
                    Controller.user.account = msg.body.data
                    break
                case 'get_user_settings_response':
                    Controller.user.settings = msg.body.data
                    break
                case 'refresh_token_response' :
                    Controller.authTokens = msg.body.tokens
                    console.log(msg)
                    break
                case 'pass_auth_response' :
                    Controller.sendMessage('check_auth')
                    break
                case 'query_datamap_response':
                    console.log(msg.body)
                    let id = msg.body.id,
                    card = this.view.cardMap.get(id),
                    infoBar
                    if (!this.view.cardHasInfoBar(card)) infoBar = this.view.attachInfoBar(card)
                    else infoBar = card.querySelector('.sub_info_bar_mdp')
                    this.view.updateInfoBar(infoBar, msg.body)

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
        // return Controller.port

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

    update() {
        let newManga = []
        this.view.updateCardMap()

        for (let key of this.view.cardMap.keys()) if (!this.view.cardHasInfoBar(this.view.cardMap.get(key))) newManga.push(key)

        if (newManga.length > 0) {
            this.sendMessage('get_manga', { idList: newManga})
            this.sendMessage('get_read', { idList: newManga})
            this.sendMessage('get_rating', { idList: newManga })
            for (let manga of newManga) {
                this.sendMessage('get_aggregate', {id: manga, language:['en']})
                this.sendMessage('query_datamap', {id:manga})
            }
        }

    }

    updateDataMap(view) {
        let newManga = []
        this.setContainers(view)

        if (!this.auth) this.setTokens(this.getTokens(view))

        for (let key of this.dataMap.keys()) if (this.dataMap.get(key).info === null) newManga.push(key)

        if (newManga.length > 0) {
            this.sendMessage('get_manga', { idList: newManga})
            this.sendMessage('get_read', { idList: newManga})
            this.sendMessage('get_rating', { idList: newManga })
            for (let manga of newManga) {
                this.sendMessage('get_aggregate', {id: manga, language:['en']})
            }
        }
    }

    getTokens() {
        let session = this.view.getCookie('auth._token.local'),
        refresh = this.view.getCookie('auth._refresh_token.local')

        return {
            session: session,
            refresh: refresh
        }
    }

    setTokens(tokens) {
        this.auth = {
            session : tokens.session,
            refresh : tokens.refresh
        }
    }

    setUser() {
        if (!this.auth.session) throw Error('No user to set in Controller.setUser()')
        this.sendMessage('get_user', { userID: 'me' })
    }

    refresh() {
        if (!this.port || this.port === undefined) this.connect()

        if (!this.auth.session && this.view.clientBrowserIsLoggedIn()) {
            this.setTokens(this.getTokens(this.view)) 
            this.sendMessage('pass_auth', { tokens: this.auth })
        }
        if (!this.user.account) this.setUser()

        this.view.updateSeenCards()
        this.view.updateCardMap()
        this.updateDataMap(this.view)
        // this.update()

        for (let card of this.view.cards) {
            let infoBar = this.view.attachInfoBar(card)
            if (this.dataMap.has(this.view.getCardID(card))) this.view.updateInfoBar(infoBar, this.dataMap.get(this.view.getCardID(card)))
        }
    }
}