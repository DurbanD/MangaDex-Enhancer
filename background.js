let globals = {}
try {
  importScripts('./service/API_Connection.js')
  // importScripts('./service/Controller.js')
  // importScripts('./service/Model.js')
  importScripts('./service/Model2.js')
} catch (e) {
  console.log(e)
}

let Controller = new globals.Model('API_Controller')

Controller.init()
Controller.startup()
