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

    setCounters() {
        for (let card of this.cards) {
            let container = document.createElement('div'),
                counter = document.createElement('p')

            container.classList = 'counter_container_MDP'
            counter.classList = 'counter_count_MDP'
            counter.innerText = '0 / 0'

            container.appendChild(counter)
            card.appendChild(container)
        }
    }

    setFavored() {

    }

}