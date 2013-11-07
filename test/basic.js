var browserify = require('browserify')
var cp = require('child_process')
var dgram = require('dgram')
var envify = require('envify/custom')
var fs = require('fs')
var once = require('once')
var path = require('path')
var portfinder = require('portfinder')
var test = require('tape')

var CHROME = '/Applications/Google\\ Chrome\\ Canary.app/Contents/MacOS/Google\\ Chrome\\ Canary'
var BUNDLE_PATH = path.join(__dirname, '../example/chrome-app/bundle.js')

var child
var socket

function browserifyClient (port, cb) {
  cb = once(cb)
  var b = browserify()
  b.add(path.join(__dirname, '../example/udp-client.js'))
  b.transform(envify({
    PORT: port.toString()
  }))
  b.bundle()
    .pipe(fs.createWriteStream(BUNDLE_PATH))
    .on('close', cb)
    .on('error', cb)
}

function launchBrowser () {
  var command = CHROME + ' --load-and-launch-app=example/chrome-app'
  child = cp.exec(command, {
    cwd: path.join(__dirname, '..')
  }, function () {})
}

function done () {
  child.kill()
  socket.close()
}

test('UDP client connects to server', function (t) {
  t.plan(2)

  portfinder.getPort(function (err, port) {
    if (err) return t.fail(err)
    socket = dgram.createSocket('udp4')

    socket.on('listening', function () {
      console.log('Listening on port ' + port)

      browserifyClient(port, function (err) {
        if (err) return t.fail(err)
        launchBrowser()
      })
    })

    var i = 0
    socket.on('message', function (message, remote) {
      console.log(i)
      if (i === 0) {
        t.equal(message.toString(), new Buffer('beep').toString())
        var response = new Buffer('boop')
        socket.send(response, 0, response.length, remote.port, remote.address)
      } else if (i === 1) {
        t.equal(message.toString(), new Buffer('done').toString())
        done()
      } else {
        t.fail('UDP server received unexpected message')
      }
      i += 1
    })

    socket.bind(port)
  })
})

