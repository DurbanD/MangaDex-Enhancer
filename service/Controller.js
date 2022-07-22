globals.Controller = class Controller {
    constructor(name) {
      this.connection = null,
      this.model = null,
      this.name = name
    }
  
    connectionListenerCallback(port) {
      globals.activeConnection.port = port
      globals.activeConnection.startMessageListener(port, async function(msg) {
        let body, type
        switch (msg.type) {
          case "idGet":
            body = await globals.activeModel.getMangaByID(100, 0, msg.body.idList)
            type = "idGet_Response"
            break
          case "chapterGet":
            body = await globals.activeModel.getChapterByID(100, 0, msg.body.idList)
            type = "chapterGet_Response"
            break
          case "readGet":
            console.log('readGet recieved: ', msg)
            body = await globals.activeModel.getReadManga(msg.body.idList, msg.body.token)
            type = "readGet_Response"
            break
          case "lookupHistory":
            body = globals.activeModel.history
            type = "history_Response"
            break
          case "login":
            body = await globals.activeModel.login(msg.body.username, msg.body.password)
            type = 'login_Response'
            break
          case "checkAuth":
            body = await globals.activeModel.checkAuth(msg.body.token)
            type = 'checkAuth_Response'
            break
          default:
            break
        }
        port.postMessage({type:type, body:body})
      })
    }
  
    backgroundMessageCallback(request, sender, sendResponse) {
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

    startup() {
      if (!this.connection) this.init()
      this.connection.startConnectionListener(this.connectionListenerCallback)
      this.connection.startMessageListener(chrome.runtime, this.backgroundMessageCallback)
    }
  }