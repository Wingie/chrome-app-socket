var bops = require('bops')
var socket = require('../')

// Send UDP packet to echo server

var PORT = Number(process.env.PORT)
var sock = new socket.UDPSocket()

sock.on('bound', function(port) {
  console.log('Bound to port: ' + port)
})

sock.write('beep', '127.0.0.1', PORT)

sock.on('data', function(data, host, port) {
  console.log('Got data from host ' + host + ' port ' + port + ': ' + bops.to(data))
  sock.write('done', '127.0.0.1', PORT)
})

