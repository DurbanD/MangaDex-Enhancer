
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
        this.defaultPayload = {
            headers: {
                'accept' : 'application/json',
                'Authorization' : this.auth.session
            },
            method: "GET"
        }
        if (Model.active) throw Error('There is already an active model')
        Model.active = this
    }
    
    static getActive () {
        if (Model.active) return Model.active
        return new Model()
    }

    // User
    // Requires Auth
    async requestUserInfo(userID, payload=this.defaultPayload) {
        let requestURL = this.API_URL + `/user/${userID}`

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    async requestRatingInfo(idList, payload=this.defaultPayload) {
        let requestURL = this.API_URL + '/rating?'
        for (let id of idList) requestURL += `&manga[]=${id}`

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    async requestReadInfo(idList, payload=this.defaultPayload) {
        let requestURL = this.API_URL + '/manga/read?'
        for (let id of idList) requestURL += `&ids[]=${id}`

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    // Manga

    async requestMangaInfo(idList, payload=this.defaultPayload, limit=100, offset=0) {
        let requestURL = this.API_URL + `/manga?limit=${limit}&offset=${offset}`

        for (let id of idList) requestURL += `&ids[]=${id}`

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    async requestChapterInfo(idList, payload=this.defaultPayload, limit=100, offset=0) {
        let requestURL = this.API_URL + `/chapter?limit=${limit}&offset=${offset}`
        for (let id of idList) requestURL += `&ids[]=${id}`

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    async requestAggregateMangaInfo(mangaID, payload=this.defaultPayload, language='en') {
        let requestURL = this.API_URL + `/manga/${mangaID}/aggregate?&translatedLanguage[]=${language}`

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    // Auth

    async checkAuthorization(payload=this.defaultPayload) {
        let requestURL = this.API_URL + '/auth/check'

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    async requestTokenRefresh(refreshToken=this.auth.refresh) {
        if (!refreshToken) throw Error('No refresh token')
        let requestURL = this.API_URL + `/auth/refresh`
        let payload = {
            headers: {
                'Content-Type' : 'application/json'
            },
            method: "POST",
            body : JSON.stringify({
                "token" : refreshToken
            })
        }
        // payload = JSON.stringify(payload)

        let request = await this.handleRequest(requestURL, payload)
        return request
    }

    async refreshAuth(refreshToken=this.auth.refresh) {
        if (!refreshToken) throw Error('No refresh token')
        let request = await this.requestTokenRefresh(refreshToken)

        if (request.result === 'ok') {
            this.auth = request.token
        }
        return request.token
    }

    clearAuth() {
        this.auth = {
            session: null,
            refresh: null
        }
    }

    // Handle API Request

    async handleRequest(url, payload) {
        let request, apiModel = Model.getActive()
        try {
            request = await fetch(url, payload).then(async res=>{
                if (parseInt(res.status) === 401) {
                    let newPayload = payload,
                        refresh = await apiModel.refreshAuth()
                    newPayload.headers.Authorization = refresh.session
                    let secondAttempt = await fetch(url, newPayload).then(R=>R.json())
                    return secondAttempt
                }
                return res.json()
            }).then(data=>data)
        }
        catch(err) {
            apiModel.history.push({url:url, payload:payload, request:request})
            throw Error(`Unable to handle request to ${url}. \n\nPayload: ${payload} \n\n Error:${err} \n\nRequest: ${request}`)
        }
        apiModel.history.push({url:url, payload:payload, request:request})
        return request
    }

    connectionListenerCallback(port) {
        globals.activeConnection.port = port
        globals.activeConnection.startMessageListener(port, async function(msg) {
            let apiModel = globals.Model.getActive(), body, type, updatedData = []
            switch (msg.type) {
                case "lookupHistory":
                    body = apiModel.history
                    type = "history_Response"
                    break
                    
                case 'get_user':
                    body = await apiModel.requestUserInfo(msg.body.userID)
                    type = 'get_user_response'
                    break

                

                case "get_rating":
                    body = await apiModel.requestRatingInfo(msg.body.idList)
                    type = 'datamap_update_notice'
                    // Set user rating in Manga datamap
                    if (body.result === "ok") {
                        for (let id of Object.keys(body.ratings)) {
                            let mangaRating = body.ratings[id].rating

                            if (!apiModel.dataMap.has(id)) apiModel.dataMap.set(id, new globals.Manga(id))
                            apiModel.dataMap.get(id).user.rating = mangaRating
                            updatedData.push(apiModel.dataMap.get(id))
                        }
                    }
                    break

                case 'get_manga':
                    body = await apiModel.requestMangaInfo(msg.body.idList)
                    type = 'datamap_update_notice'

                    // Set manga info in dataMap
                    if (body.result === "ok") {
                        for (let res of body.data) {
                            if (!apiModel.dataMap.has(res.id)) apiModel.dataMap.set(res.id, new globals.Manga(res.id))
                            apiModel.dataMap.get(res.id).info = res
                            updatedData.push(apiModel.dataMap.get(res.id))
                        }
                    }
                    break

                case 'get_read':
                    body = await apiModel.requestReadInfo(msg.body.idList)
                    type = 'get_read_response'
                    break

                case 'get_chapter':
                    body = await apiModel.requestChapterInfo(msg.body.idList)
                    type = 'datamap_update_notice'

                    // Set user read and newest read in datamap
                    if (body.result === "ok") {
                        for (let res of body.data) {
                            let id = ''
                            for (let relationship of res.relationships) if (relationship.type === 'manga') {
                                id = relationship.id
                                if (!apiModel.dataMap.has(id)) apiModel.dataMap.set(id, new globals.Manga(id))
                                if (apiModel.dataMap.has(id)) { 
                                    apiModel.dataMap.get(id).user.read.push(res)
                                    apiModel.dataMap.get(id).newestRead = Math.max(apiModel.dataMap.get(id).newestRead, parseFloat(res.attributes.chapter))
                                    
                                    updatedData.push(apiModel.dataMap.get(id))
                                }
                            }
                        }
                    }
                    break

                case 'get_aggregate' :
                    body = await apiModel.requestAggregateMangaInfo(msg.body.id)
                    body.manga_id = msg.body.id
                    type = 'datamap_update_notice'
                    
                    // Set latest released chapter in datamap
                    if (body.result === "ok") {
                        if (!apiModel.dataMap.has(body.manga_id)) apiModel.dataMap.set(body.manga_id, new globals.Manga(body.manga_id))
                        if (apiModel.dataMap.has(body.manga_id)) {
                            apiModel.dataMap.get(body.manga_id).aggregate = body.volumes

                            for (let vol of Object.values(body.volumes)) {
                                for (let ch of Object.values(vol.chapters)) {
                                    if (parseFloat(ch.chapter) > apiModel.dataMap.get(body.manga_id).newestChapter) {
                                        apiModel.dataMap.get(body.manga_id).newestChapter = parseFloat(ch.chapter)

                                    }
                                }
                            }
                            updatedData.push(apiModel.dataMap.get(body.manga_id))
                        }
                    }
                    break

                case 'check_auth':
                    body = await apiModel.checkAuthorization()
                    type = 'check_auth_response'
                    break

                case 'refresh_token' :
                    body = await apiModel.requestTokenRefresh()
                    type = 'refresh_token_response'
                    if (body.result === 'ok') apiModel.auth = body.token
                    break

                case 'pass_auth' :
                    type = 'pass_auth_response'
                    body = msg.body
                    if (apiModel.auth.refresh === null) {
                        let currentAuth = msg.body.tokens.session,
                            payload = apiModel.defaultPayload
                        payload.headers.Authorization = currentAuth

                        let authValidation = await apiModel.checkAuthorization(payload)
                        if (authValidation) {
                            if (authValidation.isAuthenticated === true) {
                                apiModel.auth = msg.body.tokens
                            }
                            else {
                                let refresh = await apiModel.requestTokenRefresh(msg.body.tokens.refresh)
                                if (refresh.result === 'ok') apiModel.auth = refresh.token
                                else body = 'Unable to authenticate'
                            }
                        }
                    }
                    break
                
                case 'query_datamap':
                    let id = msg.body.id
                    type = 'query_datamap_response'
                    body = apiModel.dataMap.has(id) ? apiModel.dataMap.get(id) : {id:id, info:false}
                    break
                
                default:
                    break
            }
            console.log(apiModel)
            if (type === 'datamap_update_notice') body = updatedData
            port.postMessage({type:type, body:body})
        })
      }

      updateGlobals() {
        globals.activeModel = this
        globals.activeConnection = this.connection
      }
    
      init() {
        const connection = globals.API_Connection.getConnection(this.name)
        this.connection = connection
        this.updateGlobals()
        connection.startConnectionListener(this.connectionListenerCallback)
      }
  }