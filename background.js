let globals = {}
try {
  importScripts('./API_Connection.js')
  importScripts('./Controller.js')
  importScripts('./Model.js')
} catch (e) {
  console.log(e)
}

let background = new globals.Controller('API_Controller')

background.init()
background.backgroundStartup()
// console.log(background)
// console.log(globals)