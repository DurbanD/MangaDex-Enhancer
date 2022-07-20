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
  }