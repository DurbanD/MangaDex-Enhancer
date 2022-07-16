globals.Controller = class Controller {
    constructor(name) {
      this.connection = null,
      this.model = null,
      this.name = name
    }
  
    connectionListenerCallback(port) {
      globals.activeConnection.port = port
      globals.activeConnection.startMessageListener(port, async function(msg) {
        if (msg.type === "idGet") {
          let mangaList = await globals.activeModel.getMangaByID(100, 0, msg.idList)
          port.postMessage(mangaList);
        }
        if (msg.type === "lookupHistory") {
            port.postMessage(globals.activeModel.history)
        }
      })
    }
  
    async backgroundMessageCallback(request, sender, sendResponse) {
      console.log(`
Message recieved by service worker. 
Sender:`, sender, `
Request: `, request);
      sendResponse({msg:`background.js recieved a message from ${sender.id} and has successfully sent a response`})
    }
  
    updateGlobals() {
      globals.activeModel = this.model
      globals.activeConnection = this.connection
    }
  
    updateController() {
      this.model = globals.activeModel
      this.connection = globals.activeConnection
    }
  
    init() {
        if (this.model !== null) throw Error('Controller is already initialized')
        this.model = new globals.Model()
        this.connection = globals.API_Connection.getConnection(this.name)
        this.updateGlobals()
    }

    backgroundStartup() {
      if (!this.connection) throw Error('No connection. Use init() first')
      this.connection.startConnectionListener(this.connectionListenerCallback)
      this.connection.startMessageListener(chrome.runtime, this.backgroundMessageCallback)
    }
  }