export default class View {

    constructor() {
        this.cards = document.querySelectorAll('.manga-card')
        this.loginListeners = new Map()
        this.logOutListeners = new Map()
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

    copyLogin(form, controller) {
        if (this.loginListeners.has(form) || form.querySelector('input[title=Username]') === null) return

        let submitAction = () => {
            let loginInfo = {
                username : document.querySelector('input[title=Username]').value,
                password : document.querySelector('input[title=Password]').value
            }
            console.log(loginInfo)
            controller.sendMessage('login', loginInfo)
        }

        this.loginListeners.set(form, form.addEventListener('submit', submitAction))
    }

    static clearLogin() {
        this.loginListeners = new Map()
    }

}