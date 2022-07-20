export default class View {
    constructor() {
        this.cards = document.querySelectorAll('.manga-card')
    }

    updateSeenCards() {
        this.cards = document.querySelectorAll('.manga-card')
    }

    getCardID(card) {
        let href = card.querySelector('a').href,
            id = href.match(/(?<=title\/)[A-Za-z0-9-]+/)
        return id[0]
    }
}