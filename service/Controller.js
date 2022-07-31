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
          // case "chapterGet":
          //   body = await globals.activeModel.getChapterByID(100, 0, msg.body.idList)
          //   type = "chapterGet_Response"
          //   break
          case "lookupHistory":
            body = globals.activeModel.history
            type = "history_Response"
            break
          // case "login":
          //   body = await globals.activeModel.login(msg.body.username, msg.body.password)
          //   type = 'login_Response'
          //   break
          case "checkAuth":
            body = await globals.activeModel.checkAuth(msg.body.token)
            type = 'checkAuth_Response'
            break
          case "get_rating":
            if (!msg.body.token) break
            body = await globals.activeModel.sendRequest('get_rating', {idList:msg.body.idList, token:msg.body.token})
            type = 'get_rating_response'
            break
          case 'get_read':
            if (!msg.body.token) break
            body = await globals.activeModel.sendRequest('get_read', {idList:msg.body.idList, token:msg.body.token})
            type = 'get_read_response'
            break
          case 'get_manga':
            body = await globals.activeModel.sendRequest('get_manga', {idList:msg.body.idList})
            type = 'get_manga_response'
            break
          case 'get_auth':
            if (!msg.body.token) break
            body = await globals.activeModel.sendRequest('get_auth', {token:msg.body.token})
            type = 'get_auth_response'
            break
          case 'get_chapter':
            console.log('get_chapter request recieved: \n', msg)
            body = await globals.activeModel.sendRequest('get_chapter', {idList: msg.body.idList})
            type = 'get_chapter_response'
            break
          case 'get_user':
            if (!msg.body.token) break
            body = await globals.activeModel.sendRequest('get_user', {userID: msg.body.userID, token: msg.body.token})
            type = 'get_user_response'
            break
          case 'get_user_settings':
            if (!msg.body.token) break
            body = await globals.activeModel.sendRequest('get_user_settings', {token: msg.body.token})
            type = 'get_user_settings_response'
            break
          case 'get_aggregate' :
            body = await globals.activeModel.sendRequest('get_aggregate', {id : msg.body.id, language : msg.body.language || 'en'})
            body.manga_id = msg.body.id
            type = 'get_aggregate_response'
            break
          case 'refresh_token' :
            body = await globals.activeModel.sendRequest('refresh_token', {token : msg.body.token})
            type = 'refresh_token_response'
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