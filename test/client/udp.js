var bops = require('bops')
var socket = require('../../')

var PORT = Number(process.env.PORT)

var sock = socket.UDPSocket()
sock.write('beep', '127.0.0.1', PORT)

sock.on('data', function (data, host, port) {
  if (bops.to(data) === 'boop') {
    sock.write('pass', '127.0.0.1', PORT)
  } else {
    sock.write('fail', '127.0.0.1', PORT)
  }
})
