export const main = async () => {
    let V, Handler, url = document.URL
    const viewSRC = chrome.runtime.getURL('./content/View.js'),
    ControllerSRC = chrome.runtime.getURL('./content/Controller.js'),
    View = await import(viewSRC),
    Controller = await import(ControllerSRC) 
    
    V = new View.default()
    Handler = new Controller.default('API_Controller')
    Handler.setView(V)
    Handler.refresh()

    new MutationObserver(()=> {
        const newCards = document.querySelectorAll('.manga-card')
        if (document.URL !== url) {
            Handler.refresh()
            url = document.URL
        }
        if (V.cards[0] !== newCards[0] && newCards.length > 0) {
            Handler.refresh()
        }
    }).observe(document, {subtree: true, childList: true})
}