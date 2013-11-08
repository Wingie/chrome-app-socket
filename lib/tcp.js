/* global chrome */

exports.TCPSocket = TCPSocket
exports.TCPListenSocket = TCPListenSocket

var EventEmitter = require('events').EventEmitter
var helper = require('./helper')
var util = require('util')

util.inherits(TCPSocket, EventEmitter)

// Represents a TCP socket that can pass data
function TCPSocket (host, port) {
  var self = this
  if (!(self instanceof TCPSocket)) return new TCPSocket(host, port)
  EventEmitter.call(self)

  self.sendBuffer = []
  self.host = host
  self.port = port
  self.isServer = (typeof self.id !== 'undefined')

  if (!self.isServer)
    self.connected = false

  self._create()
}

TCPSocket.prototype._create = function() {
  var self = this
  chrome.socket.create('tcp', {}, function (createInfo) {
    self.id = createInfo.socketId

    self._onCreated()
  })
}

TCPSocket.prototype._onCreated = function() {
  var self = this
  console.log(self.id + ' ' + self.host + ':' + self.port)
  chrome.socket.connect(self.id, self.host, self.port, function (result) {
    if (result < 0) {
      console.warn('TCPSocket ' + self.id + ' failed to connect: ' + result)
      // self.emit('error', 'connect')
      return
    }
    self._onConnected()
  })
}

TCPSocket.prototype._onConnected = function () {
  var self = this

  self.connected = true
  self.emit('connected')
  while (self.sendBuffer.length) {
    var message = self.sendBuffer.shift()
    self.write(message.data, message.cb)
  }

  self._recvLoop()
}

TCPSocket.prototype.write = function (data, cb) {
  var self = this
  cb || (cb = function () {})

  if (!self.connected) {
    self.sendBuffer.push({'data': data, 'cb': cb})
    return
  }

  data = helper.toBuffer(data)

  chrome.socket.write(self.id, data, function (writeInfo) {
    if (writeInfo.bytesWritten < 0) {
      console.warn('TCPSocket ' + self.id + ' write: ' + writeInfo.bytesWritten)
      cb(new Error('writeInfo.bytesWritten: ' + writeInfo.bytesWritten))
      self.emit('error', 'write')
    } else {
      cb(null)
    }
  })
}

TCPSocket.prototype._recvLoop = function() {
  var self = this

  chrome.socket.read(self.id, function (readInfo) {
    if (readInfo.resultCode === 0) {
      self.emit('disconnect')
    } else if (readInfo.resultCode < 0) {
      console.warn('TCPSocket ' + self.id + ' recvFrom: ', readInfo.resultCode)
      self.emit('error', 'read')
    } else {
      self.emit('data', new Uint8Array(readInfo.data))
      self._recvLoop()
    }
  })
}

util.inherits(TCPListenSocket, EventEmitter)

function TCPListenSocket (port) {
  var self = this
  if (!(self instanceof TCPListenSocket)) return new TCPListenSocket(port)
  EventEmitter.call(self)

  self.port = port
  self._create()
}

TCPListenSocket.prototype._create = function() {
  var self = this
  chrome.socket.create('tcp', {}, function (createInfo) {
    self.id = createInfo.socketId

    self._onCreated()
  })
}

TCPListenSocket.prototype._onCreated = function () {
  var self = this

  self.bound = true
  self.emit('bound')

  chrome.socket.listen(self.id, '0.0.0.0', self.port, function (result) {
    if (result < 0) {
      console.warn('TCPSocket ' + self.id + ' failed to listen')
      return
    }
    chrome.socket.accept(self.id, function (acceptInfo) {
      if (acceptInfo.resultCode < 0) {
        console.warn('TCPSocket ' + self.id + ' failed to accept')
        return
      }

      chrome.socket.getInfo(acceptInfo.socketId, function (result) {
        var connectedSocket = new TCPServerSocket_(acceptInfo.socketId,
                                                  result.peerAddress,
                                                  result.peerPort)
        self.emit('connected', connectedSocket)
      })
    })
  })
}

util.inherits(TCPServerSocket_, TCPSocket)

// Internal class for different server-side behavior
function TCPServerSocket_ (id, peerAddress, peerPort) {
  var self = this
  TCPSocket.call(self, peerAddress, peerPort)

  self.id = id
}

TCPServerSocket_.prototype._create = function () {
  var self = this
  self._onConnected()
}
