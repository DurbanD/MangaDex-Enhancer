export const main = async () => {
    console.log('main.js successfully injected')
    const viewSRC = chrome.runtime.getURL('./content/View.js')
    const ControllerSRC = chrome.runtime.getURL('./content/Controller.js')

    const View = await import(viewSRC),
        Controller = await import(ControllerSRC)
    let V = new View.default(),
        Handler = new Controller.default('API_Controller')
    
    console.log(V, Handler)
    Handler.connect()

    new MutationObserver(()=> {
        const newCards = document.querySelectorAll('.manga-card')
        if (V.cards[0] !== newCards[0]) {
            V.updateSeenCards()
            Handler.setContainers(V)
            Handler.idLookup([...Handler.dataMap.keys()])
            console.log(Handler)
        }
    }).observe(document, {subtree: true, childList: true})
}