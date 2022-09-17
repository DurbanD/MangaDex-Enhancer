globals.Manga = class Manga {
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