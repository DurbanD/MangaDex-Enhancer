class Manga {
    constructor(id) {
        this.id = id
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

globals.Model = class Model {
    static active = null

    constructor(name='') {
        this.name = name
        this.API_URL = 'https://api.mangadex.org',
        this.history = []
        this.auth = {
            session: null,
            refresh: null
        }
        this.connection = null
        this.dataMap = new Map()
        if (Model.active) throw Error('There is already an active model')
        Model.active = this
    }

    static getActive () {
        if (Model.active) return Model.active
        return new Model()
    }

    async sendRequest (type, body) {
        let query = '', payload, requestURL, request
        let basicAuthPayload = {
            headers: {
                'accept' : 'application/json',
                'Authorization' : body.token
            },
            method: "GET"
        }
        switch (type) {
            case 'get_rating':
                query = '/rating?'
                payload = basicAuthPayload
                for (let id of body.idList) query += `&manga[]=${id}`
                break

            case 'get_read':
                if (body.idList.length < 1) return null
                query = `/manga/read?`
                payload = basicAuthPayload
                for (let id of body.idList) query += `&ids[]=${id}`
                break

            case 'get_manga':
                query = `/manga?limit=${body.limit || 100}&offset=${body.offset || 0}`
                payload = basicAuthPayload
                for (let id of body.idList) query += `&ids[]=${id}`
                break
            
            case 'check_auth':
                query = '/auth/check'
                payload = basicAuthPayload
                break
            
            case 'get_chapter':
                if (!body.idList) return
                query = `/chapter?limit=${body.limit || 100}&offset=${body.offset || 0}`
                for (let id of body.idList) query += `&ids[]=${id}`
                break
            
            case 'get_user':
                query = `/user/${body.userID}`
                payload = basicAuthPayload

                break
            case 'get_user_settings' :
                if (!body.token) return
                query = '/settings'
                payload = basicAuthPayload
                break

            case 'get_aggregate' :
                if (!body.id) return
                query = `/manga/${body.id}/aggregate?`
                if (body.language) {
                    for (let lang of body.language) query += `&translatedLanguage[]=${lang}`
                }
                else query += `&translatedLanguage[]=en`
                break
            
            case 'refresh_token' :
                if (!body.token) return
                query = `/auth/refresh`
                payload = basicAuthPayload
                break
            default:
                console.log(`sendRequest type ${type} defaulted. Body: `, body)
                break
        }

        requestURL = this.API_URL+query
        console.log(`Sending Request ${type}... \n`, requestURL, payload)
        request = await fetch(requestURL, payload).then(res=>res.json()).then(data=>data)
        
        this.history.push(request)
        return request
    }

    connectionListenerCallback(port) {
        globals.activeConnection.port = port
        globals.activeConnection.startMessageListener(port, async function(msg) {
            let apiModel = globals.Model.getActive(), body, type
            switch (msg.type) {
                case "lookupHistory":
                    body = apiModel.history
                    type = "history_Response"
                    break
                
                // User Information
                //

                case 'get_user':
                    body = await apiModel.sendRequest('get_user', {userID: msg.body.userID, token: apiModel.auth.session})
                    type = 'get_user_response'
                    break
                case 'get_user_settings':
                    body = await apiModel.sendRequest('get_user_settings', {token: apiModel.auth.session})
                    type = 'get_user_settings_response'
                    break
                case "get_rating":
                    body = await apiModel.sendRequest('get_rating', {idList:msg.body.idList, token:apiModel.auth.session})

                    // Set user rating in Manga datamap
                    if (body.result === "ok") {
                        for (let id of Object.keys(body.ratings)) {
                            let mangaRating = body.ratings[id].rating
                            if (!apiModel.dataMap.has(id)) {
                                apiModel.dataMap.set(id, new Manga(id))
                            }
                            apiModel.dataMap.get(id).user.rating = mangaRating
                        }
                        console.log(apiModel)
                    }

                    type = 'get_rating_response'
                break
                case 'get_read':
                    body = await apiModel.sendRequest('get_read', {idList:msg.body.idList, token:apiModel.auth.session})
                    type = 'get_read_response'
                    break
                
                // Manga Information
                //

                case 'get_manga':
                    body = await apiModel.sendRequest('get_manga', {idList:msg.body.idList})

                    // Set manga info in dataMap
                    if (body === null) break
                    if (body.result === "ok") {
                        for (let res of body.data) {
                            if (!apiModel.dataMap.has(res.id)) apiModel.dataMap.set(res.id, new Manga(res.id))
                            apiModel.dataMap.get(res.id).info = res
                        }
                    } 

                    type = 'get_manga_response'
                    break
                case 'get_chapter':
                    console.log('get_chapter request recieved: \n', msg)
                    body = await apiModel.sendRequest('get_chapter', {idList: msg.body.idList})

                    // Set user read and newest read in datamap
                    if (body === null) break
                    if (body.result === "ok") {
                        for (let res of body.data) {
                            let id = ''
                            for (let relationship of res.relationships) if (relationship.type === 'manga') {
                                id = relationship.id
                                if (apiModel.dataMap.has(id)) { 
                                    apiModel.dataMap.get(id).user.read.push(res)
                                    apiModel.dataMap.get(id).newestRead = Math.max(apiModel.dataMap.get(id).newestRead, parseFloat(res.attributes.chapter))
                                }
                            }
                        }
                    }

                    type = 'get_chapter_response'
                    break
                case 'get_aggregate' :
                    body = await apiModel.sendRequest('get_aggregate', {id : msg.body.id, language : msg.body.language || 'en'})
                    body.manga_id = msg.body.id
                    
                    // Set latest released chapter in datamap
                    if (body.result === "ok") {
                        if (apiModel.dataMap.has(body.manga_id)) {
                            apiModel.dataMap.get(body.manga_id).aggregate = body.volumes
                            for (let vol of Object.values(body.volumes)) {
                                for (let ch of Object.values(vol.chapters)) {
                                    if (parseFloat(ch.chapter) > apiModel.dataMap.get(body.manga_id).newestChapter) apiModel.dataMap.get(body.manga_id).newestChapter = parseFloat(ch.chapter)
                                }
                            }
                        }
                    }

                    type = 'get_aggregate_response'
                    break

                // Authorization
                //
                case 'check_auth':
                    body = await apiModel.sendRequest('check_auth', {token : apiModel.auth.session})
                    type = 'check_auth_response'
                    break
                case 'refresh_token' :
                    body = await apiModel.sendRequest('refresh_token', {token : apiModel.auth.refresh})
                    apiModel.auth = body.token
                    type = 'refresh_token_response'
                    break
                case 'pass_auth' :
                    body = msg.body
                    apiModel.auth = msg.body.tokens
                    type = 'pass_auth_response'
                    break
                
                default:
                    break
            }
            console.log(`Recieved Request ${type}... \n`, body)
            console.log(apiModel)
            port.postMessage({type:type, body:body})
        })
      }
    
      backgroundMessageCallback(request, sender, sendResponse) {
          sendResponse({msg:`background.js recieved a message from ${sender.id} and has successfully sent a response`})
      }

      updateGlobals() {
        globals.activeModel = this
        globals.activeConnection = this.connection
      }
    
      updateController() {
        this.connection = globals.activeConnection
      }
    
      init() {
          this.connection = globals.API_Connection.getConnection(this.name)
          this.updateGlobals()
      }
  
      startup() {
        if (!this.connection) this.init()
        this.connection.startConnectionListener(this.connectionListenerCallback)
        this.connection.startMessageListener(chrome.runtime, this.backgroundMessageCallback)
      }
  }