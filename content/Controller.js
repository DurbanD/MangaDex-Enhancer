export default class Controller {
    static active = null
    constructor(name) {
        if (Controller.active) throw Error('Content Controller already exists')
        this.name = name
        this.port = null
        this.view = null
        Controller.active = this
    }
    static getActive(name='') {
        if (!Controller.active) new Controller('')
        return Controller.active
    }

    setView(view) {
        this.view = view
    }

    sendMessage(type, body) {
        if (!this.port) this.connect()
        this.port.postMessage({type: type, body:body});
    }

    listenForConnectionMessages () {
        if (!this.port) throw Error('Unable to listen for incoming connection messages: Port is empty')
        this.port.onMessage.addListener(function(msg, sender) {
            let activeController = Controller.getActive(), id, card, infoBar
            switch (msg.type){
                case 'get_read_response':
                    if (msg.body === null) break
                    if (msg.body.result === "ok") {
                        let readChapters = msg.body.data
                        while (readChapters.length > 0) activeController.sendMessage('get_chapter', {idList: readChapters.splice(0,100)})
                    }
                    break
                case 'check_auth_response':
                    break
                case 'get_user_response':
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
                    card = activeController.view.cardMap.get(id)

                    if (!activeController.view.cardHasInfoBar(card)) infoBar = activeController.view.attachInfoBar(card)
                    else infoBar = activeController.view.getInfoBar(card)
                    activeController.view.updateInfoBar(infoBar, msg.body)

                    break
                default: 
                    console.log(msg)
                    break
            }
          });
    }

    openConnection() {
        this.port = chrome.runtime.connect({name: this.name})
        this.port.onDisconnect.addListener(()=> this.port = null)
        return this.port

    }

    connect() {
        this.openConnection()
        this.listenForConnectionMessages()
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

    refresh() {
        if (!this.port || this.port === undefined) this.connect()
        if (this.view.clientBrowserIsLoggedIn()) {
            this.sendMessage('pass_auth', { tokens: this.getTokens() })
        }

        this.update()
    }
}