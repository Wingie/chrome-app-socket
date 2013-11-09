var bops = require('bops')
var dgram = require('../../').dgram

var PORT = Number(process.env.PORT)

var sock = dgram.createSocket('udp4')

var beep = bops.from('beep')
sock.send(beep, 0, beep.length, PORT, '127.0.0.1')

sock.on('message', function (data, rInfo) {
  if (bops.to(data) === 'boop') {
    sock.send('pass', 0, 'pass'.length, rInfo.port, rInfo.address)
  } else {
    sock.send('fail', 0, 'fail'.length, rInfo.port, rInfo.address)
  }
})