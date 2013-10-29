var chromeSocket = require('../')

var socket = new chromeSocket.UDPSocket()
socket.on('data', function (data, host, port) {
  alert(host + port)
})

socket.sendTo('hey', '127.0.0.1', 8912)