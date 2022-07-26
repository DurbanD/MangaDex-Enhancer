export const main = async () => {
    let V, Handler, url
    const viewSRC = chrome.runtime.getURL('./content/View.js'),
    ControllerSRC = chrome.runtime.getURL('./content/Controller.js'),
    View = await import(viewSRC),
    Controller = await import(ControllerSRC) 

    V = new View.default(),
    Handler = new Controller.default('API_Controller')
    url = document.URL

    // Handler.connect()

    new MutationObserver(()=> {
        const newCards = document.querySelectorAll('.manga-card')
        const authCookies = Handler.getTokens(V)
        if (document.URL !== url) {
            Handler.refresh(V)
            url = document.URL
        }
        if (V.cards[0] !== newCards[0] && newCards.length > 0) {
            Handler.refresh(V)
            console.log(Handler)
        }
        if (authCookies.session !== Handler.authTokens.session) {
            Handler.refresh(V)
            Handler.sendMessage('get_auth', {token: Handler.authTokens.session})
        }
    }).observe(document, {subtree: true, childList: true})
}