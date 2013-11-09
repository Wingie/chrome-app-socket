var bops = require('bops')
var socket = require('../../')

var PORT = Number(process.env.PORT)

var sock = socket.TCPSocket('127.0.0.1', PORT)
sock.write('beep')

sock.on('data', function (data) {
  if (bops.to(data) === 'boop') {
    sock.write('pass')
  } else {
    sock.write('fail')
  }
})
