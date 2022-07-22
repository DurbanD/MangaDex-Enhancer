export const main = async () => {
    let V, Handler
    const viewSRC = chrome.runtime.getURL('./content/View.js'),
        ControllerSRC = chrome.runtime.getURL('./content/Controller.js'),
        View = await import(viewSRC),
        Controller = await import(ControllerSRC)

    V = new View.default(),
    Handler = new Controller.default('API_Controller')

    Handler.connect()

    new MutationObserver(()=> {
        const newCards = document.querySelectorAll('.manga-card')
        const forms = document.querySelectorAll('form')
        if (V.cards[0] !== newCards[0] && newCards.length > 0) {
            V.updateSeenCards()
            Handler.updateDataMap(V)
            V.setCounters()
            console.log(Handler)

        }
        for (let form of forms) {
            if (/Log In/.test(form.innerText)) {
                console.log('Login Detected')
                V.copyLogin(form, Handler)
            }
        }
    }).observe(document, {subtree: true, childList: true})
}