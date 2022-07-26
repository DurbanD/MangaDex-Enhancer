globals.Model = class Model {
    constructor() {
        this.API_URL = 'https://api.mangadex.org',
        this.history = []
        this.authToken = null
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
            
            case 'get_auth':
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

    async login (username, password) {
        if (this.authToken !== null) return this.authToken
        let query = '/auth/login',
        payload = {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                username: username,
                email: "",
                password: password
            }),  
        }
        console.log(payload)

        let login = await fetch(this.API_URL + query, payload).then(res=>res.json()).then(data=>data)
        this.history.push(login)
        if (login.result === "ok") this.authToken = login.token

        return this.authToken

    }

  }