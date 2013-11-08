var socket = require('../../')

var PORT = Number(process.env.PORT)

var sock = socket.UDPSocket()
sock.write('beep', '127.0.0.1', PORT)

sock.on('data', function(data, host, port) {
  sock.write('done', '127.0.0.1', PORT)
})
