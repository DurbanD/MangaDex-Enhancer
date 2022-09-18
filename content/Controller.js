export default class Controller {
    static view = null
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
        this.view = Controller.view
        this.auth = {
            session:null,
            refresh:null
        },
        this.user = Controller.user
        Controller.active = this
    }

    setView(view) {
        Controller.view = view
        this.view = Controller.view
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

    static listenForConnectionMessages () {
        if (!Controller.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        Controller.port.onMessage.addListener(function(msg, sender) {
            let activeController = Controller.getActive(), id, card, infoBar
            switch (msg.type){
                case 'get_read_response':
                    if (msg.body === null) break
                    if (msg.body.result === "ok") {
                        let readChapters = msg.body.data
                        while (readChapters.length > 0) Controller.sendMessage('get_chapter', {idList: readChapters.splice(0,100)})
                    }
                    break
                case 'check_auth_response':
                    break
                case 'get_user_response':
                    Controller.user.account = msg.body.data
                    break
                case 'refresh_token_response' :
                    break
                case 'pass_auth_response' :
                    break
                case 'datamap_update_notice':   
                    for (let manga of msg.body) {
                        id = manga.id,
                        card = activeController.view.cardMap.get(id)

                        if (!activeController.view.cardHasInfoBar(card)) infoBar = activeController.view.attachInfoBar(card)
                        else infoBar = activeController.view.getInfoBar(card)

                        activeController.view.updateInfoBar(infoBar, manga)
                    }
                    break
                case 'query_datamap_response':
                    id = msg.body.id,
                    card = Controller.view.cardMap.get(id)

                    if (!Controller.view.cardHasInfoBar(card)) infoBar = Controller.view.attachInfoBar(card)
                    else infoBar = Controller.view.getInfoBar(card)
                    Controller.view.updateInfoBar(infoBar, msg.body)

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
    }

    connect() {
        Controller.connect()
        this.port = Controller.port
    }

    update() {
        let newManga,
            seenCards = []
        for (let card of this.view.seeBarlessCards()) {
            if (this.view.cardMap.has(this.view.getCardID(card))) seenCards.push(card)
        }
        newManga = this.view.updateCardMap()

        if (newManga.length > 0) {
            let idList = []
            for (let manga of newManga) {
                idList.push(manga.key)
                this.sendMessage('get_aggregate', {id: manga.key, language:['en']})
            }
            
            this.sendMessage('get_manga', { idList: idList})
            this.sendMessage('get_read', { idList: idList})
            this.sendMessage('get_rating', { idList: idList })
        }

        for (let card of seenCards) {
            this.sendMessage('query_datamap', {id: this.view.getCardID(card)})
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

        this.update()
    }
}