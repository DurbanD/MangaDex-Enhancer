let globals = {}
try {
  importScripts('./service/API_Connection.js')
  importScripts('./service/Controller.js')
  importScripts('./service/Model.js')
} catch (e) {
  console.log(e)
}

let background = new globals.Controller('API_Controller')

background.init()
background.backgroundStartup()
