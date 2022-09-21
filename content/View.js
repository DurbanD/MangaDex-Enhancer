export default class View {

    constructor() {
        this.cards = document.querySelectorAll('.manga-card')
        this.cardMap = new Map()
        this.infoBarClassList = 'sub_info_bar_mdp'
    }

    clientBrowserIsLoggedIn() {
        let session = this.getCookie('auth._token.local')
        if (session && session !== 'false' ) return true
        return false
    }

    updateCardMap() {
        let newCards = []
        this.updateSeenCards()
        for (let card of this.cards) {
            let cardID = this.getCardID(card)
            if (!this.cardMap.has(cardID)) {
                this.cardMap.set(cardID, card)
                newCards.push({key:cardID, value:this.cardMap.get(cardID)})
            }
            this.cardMap.set(cardID, card)
        }
        return newCards
    }

    updateSeenCards() {
        this.cards = document.querySelectorAll('.manga-card')
    }

    seeCards() {
        return document.querySelectorAll('.manga-card')
    }

    seeBarlessCards() {
        let currentCards = this.seeCards(),
            barlessCards = []
        for (let card of currentCards) {
            if (!this.cardHasInfoBar(card)) barlessCards.push(card)
        }
        return barlessCards
    }

    cardHasInfoBar(card) {
        if (!card) return false
        if (card.querySelectorAll(`.${this.infoBarClassList}`).length>0) return true
        return false
    }

    getCardID(card) {
        if (!card) return
        let href = card.querySelector('a').href,
            id = href.match(/(?<=title\/)[A-Za-z0-9-]+/)
        return id[0]
    }

    updateInfoBar(infoBar, Manga) {
        if (!infoBar) return
        let counterRead = infoBar.querySelector('.chapter_counter_read_mdp'),
            counterAvailable = infoBar.querySelector('.chapter_counter_available_mdp'),
            rank = infoBar.querySelector('.mdp_rank'),
            rankFlair = infoBar.querySelector('.rank_flair')

        if (counterRead.innerText === '0') counterRead.innerText = `${Manga.newestRead}`
        if (counterAvailable.innerText === '0') counterAvailable.innerText =  `${Manga.newestChapter}`
        
        if (Manga.user.rating !== null) {
            rank.innerText = `${Manga.user.rating}`
            rankFlair.innerText = '🌟'
            rankFlair.classList = 'rank_flair mdp_rated_flair'
        }
    }

    attachInfoBar(container) {
        if (!container) return
        let infoBar = document.createElement('div')
        infoBar.classList = this.infoBarClassList
        infoBar.appendChild(this.chapterCounter())
        infoBar.appendChild(this.rankDisplay())

        container.appendChild(infoBar)

        return infoBar
    }

    getInfoBar(card) {
        return card.querySelector(`.${this.infoBarClassList}`)
    }

    chapterCounter() {
        let container = document.createElement('div'),
        read = document.createElement('p'),
        available = document.createElement('p'),
        flair = document.createElement('p')

        container.classList = 'counter_container_mdp'
        read.classList = 'chapter_counter_read_mdp'
        available.classList = 'chapter_counter_available_mdp'
        flair.classList = 'chapter_counter_flair_mdp'

        read.innerText = '0'
        flair.innerText = ' / '
        available.innerText = '0'

        container.appendChild(read)
        container.appendChild(flair)
        container.appendChild(available)

        return container
    }

    rankDisplay() {
        let container = document.createElement('div'),
            rank = document.createElement('p'),
            flair = document.createElement('p')
        container.classList = 'rank_container'
        rank.classList = 'mdp_rank'
        flair.classList = 'rank_flair'

        rank.innerText = '-'
        flair.innerText = '⭐'
        container.appendChild(rank)
        container.appendChild(flair)

        return container

    }

    getCookie(name) {
        let nameRegex = new RegExp(name + '='),
        decodedCookie = decodeURIComponent(document.cookie),
        cookies = decodedCookie.split(';');

        for (let cookie of cookies) {
            if (nameRegex.test(cookie)) {
                let res = cookie.trim()
                return res.substring(name.length + 1, res.length)
            }
        }
        return null
    }
}