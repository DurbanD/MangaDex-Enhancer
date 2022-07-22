let globals = {}
try {
  importScripts('./service/API_Connection.js')
  importScripts('./service/Controller.js')
  importScripts('./service/Model.js')
} catch (e) {
  console.log(e)
}

let Controller = new globals.Controller('API_Controller')

Controller.init()
Controller.startup()
