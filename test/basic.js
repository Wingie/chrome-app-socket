// Unfinished tests

var dgram = require('dgram')
var portfinder = require('portfinder')
var socket = require('../')
var test = require('tape')

function udpEchoServer (cb) {
  portfinder.getPort(function (port) {
    var server = dgram.createSocket('udp4')

    server.on('listening', function () {
      cb(port)
    })

    server.on('message', function (message, remote) {
      console.log(remote.address + ':' + remote.port +' - ' + message)
    })

    server.bind(port, '127.0.0.1')
  })
}

test('')