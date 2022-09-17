export default class View {

    constructor() {
        this.cards = document.querySelectorAll('.manga-card')
        this.cardMap = new Map()
        // this.loginListeners = new Map()
        // this.logOutListeners = new Map()
    }

    updateSeenCards() {
        this.cards = document.querySelectorAll('.manga-card')
    }

    getCardID(card) {
        let href = card.querySelector('a').href,
            id = href.match(/(?<=title\/)[A-Za-z0-9-]+/)
        return id[0]
    }

    updateInfoBar(infoBar, Manga) {
        // console.log('Updating ', infoBar, ' with ', Manga)
        let counterRead = infoBar.querySelector('.chapter_counter_read_mdp'),
            counterAvailable = infoBar.querySelector('.chapter_counter_available_mdp'),
            rank = infoBar.querySelector('.mdp_rank'),
            rankFlair = infoBar.querySelector('.rank_flair')

        counterRead.innerText = `${Manga.newestRead}`
        counterAvailable.innerText =  `${Manga.newestChapter}`
        
        if (Manga.user.rating !== null) {
            rank.innerText = `${Manga.user.rating}`
            rankFlair.innerText = '🌟'
            rankFlair.classList = 'rank_flair mdp_rated_flair'
        }
    }

    attachInfoBar(container) {
        let infoBar = document.createElement('div')
        infoBar.classList = 'sub_info_bar_mdp'
        infoBar.appendChild(this.chapterCounter())
        infoBar.appendChild(this.rankDisplay())

        container.appendChild(infoBar)

        return infoBar
    }

    chapterCounter() {
        let container = document.createElement('div'),
        counter = document.createElement('p'),
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