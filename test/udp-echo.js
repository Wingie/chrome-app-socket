var dgram = require('dgram')
var helper = require('./helper')
var portfinder = require('portfinder')
var test = require('tape')

test('UDP local-initiated echo', function (t) {
  t.plan(2)

  portfinder.getPort(function (err, port) {
    if (err) return t.fail(err)
    var socket = dgram.createSocket('udp4')
    var child

    socket.on('listening', function () {
      var env = { PORT: port }
      helper.browserify('udp.js', env, function (err) {
        if (err) return t.fail(err)
        child = helper.launchBrowser()
      })
    })

    var i = 0
    socket.on('message', function (message, remote) {
      if (i === 0) {
        t.equal(message.toString(), new Buffer('beep').toString())
        var response = new Buffer('boop')
        socket.send(response, 0, response.length, remote.port, remote.address)
      } else if (i === 1) {
        t.equal(message.toString(), new Buffer('done').toString())
        socket.close()
        child.kill()
      } else {
        t.fail('UDP server received unexpected message')
      }
      i += 1
    })

    socket.bind(port)
  })
})

