globals.Model = class Model {
    constructor() {
        this.API_URL = 'https://api.mangadex.org',
        this.history = []
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

        console.log(this.API_URL+query)

        let chapterList = await fetch(this.API_URL+query).then(res=>res.json()).then(data=>data)
        this.history.push(chapterList)
        return chapterList
    }

    async getReadManga (limit, offset, idList=[]) {
        let query = `/manga/read?limit=${limit}&offset=${offset}`
        for (let id of idList) query += `&ids[]=${id}`

        console.log(this.API_URL+query)

        let readList = await fetch(this.API_URL+query).then(res=>res.json()).then(data=>data)
        this.history.push(readList)
        return readList
    }
  }