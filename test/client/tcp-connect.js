var bops = require('bops')
var net = require('../../').net

var PORT = Number(process.env.PORT)

var client = net.createConnection({
  port: PORT,
  host: '127.0.0.1'
})

// If any errors are emitted, send them to the server to cause tests to fail
client.on('error', function (err) {
  console.error(err)
  console.log(err.stack)
  // client.write(err.message)
})

client.write('beep')

client.on('data', function (data) {
  if (bops.to(data) === 'boop') {
    client.write('pass')
  } else {
    client.write('fail')
  }
})
