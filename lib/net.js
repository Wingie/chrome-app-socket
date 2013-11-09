/* global chrome */

/**
 * Unimplemented:
 *
 * net.isIP(input)
 * net.isIPv4(input)
 * net.isIPv6(input)
 */

var EventEmitter = require('events').EventEmitter
var helper = require('./helper')
var is = require('core-util-is')
var stream = require('stream')
var util = require('util')

/**
 * Returns an array [options] or [options, cb]
 * It is the same as the argument of Socket.prototype.connect().
 */
function normalizeConnectArgs (args) {
  var options = {}

  if (is.isObject(args[0])) {
    // connect(options, [cb])
    options = args[0]
  } else {
    // connect(port, [host], [cb])
    options.port = args[0]
    if (is.isString(args[1])) {
      options.host = args[1]
    }
  }

  var cb = args[args.length - 1]
  return is.isFunction(cb) ? [options, cb] : [options]
}

exports.createServer = function (options, listener) {
  return new Server(arguments[0], arguments[1])
}

/**
 * net.connect(options, [connectionListener])
 * net.createConnection(options, [connectionListener])
 *
 * Constructs a new socket object and opens the socket to the given location.
 * When the socket is established, the 'connect' event will be emitted.
 *
 * For TCP sockets, options argument should be an object which specifies:
 *
 *   port: Port the client should connect to (Required).
 *   host: Host the client should connect to. Defaults to 'localhost'.
 *   localAddress: Local interface to bind to for network connections.
 *
 * ===============================================================
 *
 * net.connect(port, [host], [connectListener])
 * net.createConnection(port, [host], [connectListener])
 *
 * Creates a TCP connection to port on host. If host is omitted,
 * 'localhost' will be assumed. The connectListener parameter will be
 * added as an listener for the 'connect' event.
 *
 */
exports.connect = exports.createConnection = function () {
  var args = normalizeConnectArgs(arguments)
  var s = new Socket(args[0])
  return Socket.prototype.connect.apply(s, args)
}

util.inherits(Server, EventEmitter)

/**
 * Class: net.Server
 * =================
 *
 * This class is used to create a TCP server.
 *
 * Event: 'listening'
 *   Emitted when the server has been bound after calling server.listen.
 *
 * Event: 'connection'
 *   - Socket object The connection object
 *   Emitted when a new connection is made. socket is an instance of net.Socket.
 *
 * Event: 'close'
 *   Emitted when the server closes. Note that if connections exist, this event
 *   is not emitted until all connections are ended.
 *
 * Event: 'error'
 *   - Error Object
 *   Emitted when an error occurs. The 'close' event will be called directly
 *   following this event. See example in discussion of server.listen.
 */
function Server (/* [ options, ] listener */) {
  var self = this
  if (!(self instanceof Server)) return new Server(arguments[0], arguments[1])
  EventEmitter.call(self)

  var options

  if (is.isFunction(arguments[0])) {
    options = {}
    self.on('connection', arguments[0])
  } else {
    options = arguments[0] || {}

    if (is.isFunction(arguments[1])) {
      self.on('connection', arguments[1])
    }
  }

  self._connections = 0

  // self.port = port
  // self._create()
}

Server.prototype.listen = function (port, host, backlog, callback) {
  var self = this

}

// Server.prototype.listen = function (handle, [callback]) {
//   var self = this

// }

Server.prototype.close = function (callback) {
  var self = this

}

/**
 * Returns the bound address, the address family name and port of the socket
 * as reported by the operating system. Returns an object with three
 * properties, e.g. { port: 12346, family: 'IPv4', address: '127.0.0.1' }
 *
 * @return {Object} information
 */
Server.prototype.address = function () {
  var self = this
  return {
    address: self._address,
    port: self._port,
    family: self._family
  }
}

Server.prototype.unref = function () {
  // No chrome.socket equivalent
}

Server.prototype.ref = function () {
  // No chrome.socket equivalent
}

Server.prototype.maxConnections

Server.prototype.connections

Server.prototype.getConnections = function (callback) {
  var self = this

}

Server.prototype._create = function() {
  var self = this
  chrome.socket.create('tcp', {}, function (createInfo) {
    self.id = createInfo.socketId

    self._onCreated()
  })
}

Server.prototype._onCreated = function () {
  var self = this

  chrome.socket.listen(self.id, '0.0.0.0', self.port, function (result) {
    if (result < 0) {
      self.emit('error', new Error('Socket ' + self.id + ' failed to listen'))
      self.close()
      return
    }

    self.emit('listening')

    chrome.socket.accept(self.id, function (acceptInfo) {
      if (acceptInfo.resultCode < 0) {
        self.emit('error', new Error('Socket ' + self.id + ' failed to accept'))
        self.close()
        return
      }

      self._connections += 1

      var acceptedSocket = new Socket({
        server: self,
        id: acceptInfo.socketId
      })
      self.emit('connection', acceptedSocket)
    })
  })
}

util.inherits(Socket, stream.Duplex)

/**
 * Class: net.Socket
 * =================
 *
 * This object is an abstraction of a TCP or UNIX socket. net.Socket instances
 * implement a duplex Stream interface. They can be created by the user and
 * used as a client (with connect()) or they can be created by Node and passed
 * to the user through the 'connection' event of a server.
 *
 * Construct a new socket object.
 *
 * options is an object with the following defaults:
 *
 *   { fd: null // NO CHROME EQUIVALENT
 *     type: null
 *     allowHalfOpen: false // NO CHROME EQUIVALENT
 *   }
 *
 * `type` can only be 'tcp4' (for now).
 *
 * Event: 'connect'
 *   Emitted when a socket connection is successfully established. See
 *   connect().
 *
 * Event: 'data'
 *   - Buffer object
 *   Emitted when data is received. The argument data will be a Buffer or
 *   String. Encoding of data is set by socket.setEncoding(). (See the Readable
 *   Stream section for more information.)
 *
 *   Note that the data will be lost if there is no listener when a Socket
 *   emits a 'data' event.
 *
 * Event: 'end'
 *   Emitted when the other end of the socket sends a FIN packet.
 *
 *   By default (allowHalfOpen == false) the socket will destroy its file
 *   descriptor once it has written out its pending write queue. However,
 *   by setting allowHalfOpen == true the socket will not automatically
 *   end() its side allowing the user to write arbitrary amounts of data,
 *   with the caveat that the user is required to end() their side now.
 *
 * Event: 'timeout'
 *   Emitted if the socket times out from inactivity. This is only to notify
 *   that the socket has been idle. The user must manually close the connection.
 *
 *   See also: socket.setTimeout()
 *
 * Event: 'drain'
 *   Emitted when the write buffer becomes empty. Can be used to throttle
 *   uploads.
 *
 *   See also: the return values of socket.write()
 *
 * Event: 'error'
 *   - Error object
 *   Emitted when an error occurs. The 'close' event will be called directly
 *   following this event.
 *
 * Event: 'close'
 *   - had_error Boolean true if the socket had a transmission error
 *   Emitted once the socket is fully closed. The argument had_error is a
 *   boolean which says if the socket was closed due to a transmission error.
 */
function Socket (options) {
  var self = this
  if (!(self instanceof Socket)) return new Socket(options)

  if (is.isUndefined(options))
    options = {}

  options.decodeStrings = false // we will handle strings directly

  stream.Duplex.call(self, options)

  self.destroyed = false
  self.errorEmitted = false
  self.readable = self.writable = false

  self.bytesRead = 0
  self.bytesWritten = 0

  self._connecting = false
  self._connected = false
  self.sendQueue_ = []

  // If server socket, then it's already connected.
  if (options.server) {
    self.server = options.server
    self.id = options.id
    self._onConnect()
  }
}

/**
 * socket.connect(port, [host], [connectListener])
 * socket.connect(options, [connectListener])
 *
 * Opens the connection for a given socket. If port and host are given, then
 * the socket will be opened as a TCP socket, if host is omitted, localhost
 * will be assumed. If a path is given, the socket will be opened as a unix
 * socket to that path.
 *
 * Normally this method is not needed, as net.createConnection opens the
 * socket. Use this only if you are implementing a custom Socket.
 *
 * This function is asynchronous. When the 'connect' event is emitted the
 * socket is established. If there is a problem connecting, the 'connect'
 * event will not be emitted, the 'error' event will be emitted with the
 * exception.
 *
 * The connectListener parameter will be added as an listener for the
 * 'connect' event.
 *
 * @param  {Object} options
 * @param  {function} cb
 * @param  {[type]} [connectListener] [description]
 * @return {[type]}                   [description]
 */
Socket.prototype.connect = function (options, cb) {
  var self = this

  chrome.socket.create('tcp', {}, function (createInfo) {
    self.id = createInfo.socketId

    chrome.socket.connect(self.id,
                          options.host,
                          options.port,
                          function (result) {
      if (result < 0) {
        self.destroy('error', new Error('Socket ' + self.id +
            ' connect error ' + result))
        return
      }

      self._onConnect()
    })
  })

  return self
}

Socket.prototype._onConnect = function () {
  var self = this

  self._connecting = false
  self.readable = self.writable = true

  chrome.socket.getInfo(self.id, function (result) {
    self.remoteAddress = result.peerAddress
    self.remotePort = result.peerPort
    self.localAddress = result.localAddress
    self.localPort = result.localPort

    self.emit('connect')

    // start the first read, or get an immediate EOF.
    // this doesn't actually consume any bytes, because len=0
    self.read(0)
  })

}

// Socket.prototype.bufferSize

/**
 * Sends data on the socket. The second parameter specifies the encoding in
 * the case of a string--it defaults to UTF8 encoding.
 *
 * Returns true if the entire data was flushed successfully to the kernel
 * buffer. Returns false if all or part of the data was queued in user memory.
 * 'drain' will be emitted when the buffer is again free.
 *
 * The optional callback parameter will be executed when the data is finally
 * written out - this may not be immediately.
 *
 * @param  {ArrayBuffer|TypedArray|string} chunk
 * @param  {string} [encoding]
 * @param  {function} [callback]
 * @return {boolean}             flushed to kernel completely?
 */
Socket.prototype.write = function (chunk, encoding, callback) {
  chunk = helper.toBuffer(chunk)
  return stream.Duplex.prototype.write.call(this, chunk, encoding, callback)
}

Socket.prototype._write = function (chunk, encoding, callback) {
  var self = this
  if (!callback) callback = function () {}

  if (!self.writable) {
    self.once('connect', function () {
      self._write(chunk, encoding, callback)
    })
    return
  }

  chrome.socket.write(self.id, chunk, function (writeInfo) {
    if (writeInfo.bytesWritten < 0) {
      var err = new Error('Socket ' + self.id + ' write error ' +
          writeInfo.bytesWritten)
      self.destroy(err, callback)
    } else {
      callback(null)
    }
  })
}

Socket.prototype._read = function (n) {
  var self = this
  if (self._connecting) {
    self.once('connect', self._read.bind(self, n))
    return
  }

  chrome.socket.read(self.id, function (readInfo) {
    if (readInfo.resultCode === 0) {
      self.close()

    } else if (readInfo.resultCode < 0) {
      self.destroy(new Error('Socket ' + self.id + ' read error ' +
          readInfo.resultCode))

    } else {
      var pushMore = self.push(new Uint8Array(readInfo.data))
      if (pushMore) self._read()
    }
  })
}

Socket.prototype.destroy = function (exception, cb) {
  var self = this

  function fireErrorCallbacks () {
    if (cb) cb(exception)
    if (exception && !self.errorEmitted) {
      process.nextTick(function () {
        self.emit('error', exception)
      })
      self.errorEmitted = true
    }
  }

  if (self.destroyed) {
    // already destroyed, fire error callbacks
    fireErrorCallbacks()
    return
  }

  self._connecting = false
  this.readable = this.writable = false

  chrome.socket.disconnect(self.id)
  chrome.socket.destroy(self.id)

  self.emit('close', !!exception)
  fireErrorCallbacks()

  self.destroyed = true

  if (this.server) {
    this.server._connections -= 1
  }
}

Socket.prototype.setTimeout = function (timeout, callback) {
  var self = this

}

/**
 * Disables the Nagle algorithm. By default TCP connections use the Nagle
 * algorithm, they buffer data before sending it off. Setting true for noDelay
 * will immediately fire off data each time socket.write() is called. noDelay
 * defaults to true.
 *
 * NOTE: The Chrome version of this function is async, whereas the node
 * version is sync. Keep this in mind.
 *
 * @param {boolean} [noDelay] Optional
 * @param {function} callback CHROME-SPECIFIC: Called when the configuration
 *                            operation is done.
 */
Socket.prototype.setNoDelay = function (noDelay, callback) {
  var self = this
  // backwards compatibility: assume true when `enable` is omitted
  noDelay = is.isUndefined(noDelay) ? true : !!noDelay
  if (!callback) callback = function () {}
  chrome.socket.setNoDelay(self.id, noDelay, callback)
}

/**
 * Enable/disable keep-alive functionality, and optionally set the initial
 * delay before the first keepalive probe is sent on an idle socket. enable
 * defaults to false.
 *
 * Set initialDelay (in milliseconds) to set the delay between the last data
 * packet received and the first keepalive probe. Setting 0 for initialDelay
 * will leave the value unchanged from the default (or previous) setting.
 * Defaults to 0.
 *
 * NOTE: The Chrome version of this function is async, whereas the node
 * version is sync. Keep this in mind.
 *
 * @param {boolean} [enable] Optional
 * @param {number} [initialDelay]
 * @param {function} callback CHROME-SPECIFIC: Called when the configuration
 *                            operation is done.
 */
Socket.prototype.setKeepAlive = function (enable, initialDelay, callback) {
  var self = this
  if (!callback) callback = function () {}
  chrome.socket.setKeepAlive(self.id, !!enable, ~~(initialDelay / 1000),
      callback)
}

/**
 * Returns the bound address, the address family name and port of the socket
 * as reported by the operating system. Returns an object with three
 * properties, e.g. { port: 12346, family: 'IPv4', address: '127.0.0.1' }
 *
 * @return {Object} information
 */
Socket.prototype.address = function () {
  var self = this
  return {
    address: self.localAddress,
    port: self.localPort,
    family: 'IPv4'
  }
}

Object.defineProperty(Socket.prototype, 'readyState', {
  get: function() {
    var self = this
    if (self._connecting) {
      return 'opening'
    } else if (self.readable && self.writable) {
      return 'open'
    } else {
      return 'closed'
    }
  }
})

Socket.prototype.unref = function () {
  // No chrome.socket equivalent
}

Socket.prototype.ref = function () {
  // No chrome.socket equivalent
}
