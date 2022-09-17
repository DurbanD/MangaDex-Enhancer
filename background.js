let globals = {}
try {
  importScripts('./service/Manga.js')
  importScripts('./service/API_Connection.js')
  importScripts('./service/API_Model.js')
} catch (e) {
  console.log(e)
}

let Controller = new globals.Model('API_Controller')

Controller.init()
// Controller.startup()
