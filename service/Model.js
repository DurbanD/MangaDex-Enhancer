globals.Model = class Model {
    constructor() {
        this.API_URL = 'https://api.mangadex.org',
        this.history = []
        this.authToken = null
    }
    async getMangaByID (limit, offset, idList=[]) {
        let query = `/manga?limit=${limit}&offset=${offset}`
        for (let id of idList) query += `&ids[]=${id}`
      
        let mangaList = await fetch(this.API_URL+query).then(res=>res.json()).then(data=>data)
        this.history.push(mangaList)
        return mangaList
    }

    async getChapterByID (limit, offset, idList=[]) {
        let query = `/chapter?limit=${limit}&offset=${offset}`
        for (let id of idList) query += `&ids[]=${id}`

        let chapterList = await fetch(this.API_URL+query).then(res=>res.json()).then(data=>data)
        this.history.push(chapterList)
        return chapterList
    }

    async getReadManga (limit, offset, idList=[]) {
        let query = `/manga/read?limit=${limit}&offset=${offset}`
        for (let id of idList) query += `&ids[]=${id}`

        let readList = await fetch(this.API_URL+query).then(res=>res.json()).then(data=>data)
        this.history.push(readList)
        return readList
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

    async checkAuth (token) {
        let query = '/auth/check',
        payload = {
            headers: {
                'accept' : 'application/json',
                'Authorization' : token
            },
            method: "GET"
        }

        console.log(payload)
        let auth = await fetch(this.API_URL + query, payload).then(res=>res.json()).then(data=>data)
        this.history.push(auth)

        return auth
    }
  }