var bops = require('bops')
var dgram = require('../../').dgram

var PORT = Number(process.env.PORT)

var sock = dgram.createSocket('udp4')

// If any errors are emitted, send them to the server to cause tests to fail
sock.on('error', function (err) {
  console.error(err)
  console.log(err.stack)
  sock.send(err.message, 0, err.message.length, PORT, '127.0.0.1')
})

sock.send('beep', 0, 'beep'.length, PORT, '127.0.0.1')

sock.on('message', function (data, rInfo) {
  if (bops.to(data) === 'boop') {
    sock.send('pass', 0, 'pass'.length, rInfo.port, rInfo.address)
  } else {
    sock.send('fail', 0, 'fail'.length, rInfo.port, rInfo.address)
  }
})
