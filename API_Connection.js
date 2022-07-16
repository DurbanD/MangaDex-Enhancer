// Singleton model
globals.API_Connection = class API_Connection {
    static connection = null
    static getConnection(name) {
      if (API_Connection.connection === null) new API_Connection(name)
      return API_Connection.connection
    }
  
    constructor(name) {
      this.name = name
      this.port = null
      if (API_Connection.connection !== null) throw Error('API_Connection already exists')
      API_Connection.connection = this
    }
      
    startConnectionListener(callback) {
        chrome.runtime.onConnect.addListener(callback);
    }
  
    startMessageListener(source, callback) {
        source.onMessage.addListener(callback)
    }
  
    contentListener(msg) {
      console.log(msg)
    }  
  
    connect() {
      if (this.port !== null) {
        throw Error(`API Connection ${this.name} is already connected`)
      }
      this.port = chrome.runtime.connect({name: this.name});
    }
  }