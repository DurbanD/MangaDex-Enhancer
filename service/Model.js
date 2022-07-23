globals.Model = class Model {
    constructor() {
        this.API_URL = 'https://api.mangadex.org',
        this.history = []
        this.authToken = null
    }

    async sendRequest (type, body) {
        let query = '', payload
        switch (type) {
            case 'get_rating':
                query = '/rating?'
                payload = {
                    headers: {
                        'accept' : 'application/json',
                        'Authorization' : body.token
                    },
                    method: "GET"
                }
                for (let id of body.idList) query += `&manga[]=${id}`
                break

            case 'get_read':
                query = `/manga/read?`
                payload = {
                    headers: {
                        'accept' : 'application/json',
                        'Authorization' : body.token
                    },
                    method: "GET"
                }
                for (let id of body.idList) query += `&ids[]=${id}`
                break

            case 'get_manga':
                query = `/manga?limit=${body.limit || 100}&offset=${body.offset || 0}`
                for (let id of body.idList) query += `&ids[]=${id}`
                break
            
            case 'get_auth':
                query = '/auth/check'
                payload = {
                    headers: {
                        'accept' : 'application/json',
                        'Authorization' : body.token
                    },
                    method: "GET"
                }
                break
            
            case 'get_chapter':
                if (!body.idList) return
                query = `/chapter?limit=${body.limit || 100}&offset=${body.offset || 0}`
                for (let id of body.idList) query += `&ids[]=${id}`
                break
            
            default:
                console.log(`sendRequest type ${type} defaulted. Body: `, body)
        }

        let request = await fetch(this.API_URL+query, payload).then(res=>res.json()).then(data=>data)
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