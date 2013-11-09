/* global chrome */

/**
 * TODO
 * ====
 *
 * socket.close()
 * socket.address()
 * socket.setBroadcast(flag)
 * socket.setTTL(ttl)
 * socket.setMulticastTTL(ttl)
 * socket.setMulticastLoopback(flag)
 * socket.addMembership(multicastAddress, [multicastInterface])
 * socket.dropMembership(multicastAddress, [multicastInterface])
 * socket.unref()
 * socket.ref()
 */

exports.Socket = Socket

var EventEmitter = require('events').EventEmitter
var helper = require('./helper')
var util = require('util')

var BIND_STATE_UNBOUND = 0
var BIND_STATE_BINDING = 1
var BIND_STATE_BOUND = 2

/**
 * dgram.createSocket(type, [callback])
 *
 * Creates a datagram Socket of the specified types. Valid types are `udp4`
 * and `udp6`.
 *
 * Takes an optional callback which is added as a listener for message events.
 *
 * Call socket.bind if you want to receive datagrams. socket.bind() will bind
 * to the "all interfaces" address on a random port (it does the right thing
 * for both udp4 and udp6 sockets). You can then retrieve the address and port
 * with socket.address().address and socket.address().port.
 *
 * @param  {string} type       Either 'udp4' or 'udp6'
 * @param  {function} listener Attached as a listener to message events.
 *                             Optional
 * @return {Socket}            Socket object
 */
exports.createSocket = function (type, listener) {
  return new Socket(type, listener)
}

util.inherits(Socket, EventEmitter)

/**
 * Class: dgram.Socket
 *
 * The dgram Socket class encapsulates the datagram functionality. It should
 * be created via `dgram.createSocket(type, [callback])`.
 *
 * Events
 * ======
 *
 * Event: 'message'
 *   msg Uint8Array object. The message
 *   rinfo Object. Remote address information
 * Event: 'listening'
 * Event: 'close'
 * Event: 'error'
 *   exception Error object
 */
function Socket (type, listener) {
  var self = this
  EventEmitter.call(self)

  if (type !== 'udp4')
    throw new Error('Bad socket type specified. Valid types are: udp4')

  if (typeof listener === 'function')
    self.on('message', listener)

  self.localPort = 0
  self._sendQueue = []
  self._bindState = BIND_STATE_UNBOUND
}

/**
 * socket.bind(port, [address], [callback])
 *
 * For UDP sockets, listen for datagrams on a named port and optional address.
 * If address is not specified, the OS will try to listen on all addresses.
 * After binding is done, a "listening" event is emitted and the callback(if
 * specified) is called. Specifying both a "listening" event listener and
 * callback is not harmful but not very useful.
 *
 * A bound datagram socket keeps the node process running to receive
 * datagrams.
 *
 * If binding fails, an "error" event is generated. In rare case (e.g. binding
 * a closed socket), an Error may be thrown by this method.
 *
 * @param {number} port
 * @param {string} address Optional
 * @param {function} callback Function with no parameters, Optional. Callback
 *                            when binding is done.
 */
Socket.prototype.bind = function (port, address, callback) {
  var self = this
  if (typeof address === 'function') {
    callback = address
    address = undefined
  }

  if (!address)
    address = '0.0.0.0'

  if (self._bindState !== BIND_STATE_UNBOUND)
    throw new Error('Socket is already bound')

  self._bindState = BIND_STATE_BINDING

  if (typeof callback === 'function')
    self.once('listening', callback)

  chrome.socket.create('udp', {}, function (createInfo) {
    self.id = createInfo.socketId

    chrome.socket.bind(self.id, address, port, function (result) {
      if (result < 0) {
        self.emit('error', new Error('Socket ' + self.id + ' failed to bind'))
        return
      }
      chrome.socket.getInfo(self.id, function (result) {
        if (!result.localPort) {
          self.emit(new Error('Cannot get local port for Socket ' + self.id))
          return
        }
        self.localPort = result.localPort
        self._onBound()
      })
    })
  })
}

Socket.prototype._onBound = function () {
  var self = this

  self._bindState = BIND_STATE_BOUND
  self.emit('listening', self.localPort)

  for (var i = 0; i < self._sendQueue.length; i++) {
    self.send.apply(self, self._sendQueue[i])
  }

  self._recvLoop()
}

/**
 * socket.send(buf, offset, length, port, address, [callback])
 *
 * For UDP sockets, the destination port and IP address must be
 * specified. A string may be supplied for the address parameter, and it will
 * be resolved with DNS. An optional callback may be specified to detect any
 * DNS errors and when buf may be re-used. Note that DNS lookups will delay
 * the time that a send takes place, at least until the next tick. The only
 * way to know for sure that a send has taken place is to use the callback.
 *
 * If the socket has not been previously bound with a call to bind, it's
 * assigned a random port number and bound to the "all interfaces" address
 * (0.0.0.0 for udp4 sockets, ::0 for udp6 sockets).
 *
 * @param {Buffer|ArrayBuffer|TypedArray|String} buf Message to be sent
 * @param {number} offset Offset in the buffer where the message starts.
 * @param {number} length Number of bytes in the message.
 * @param {number} port destination port
 * @param {string} address destination IP
 * @param {function} callback Callback when message is done being delivered.
 *                            Optional.
 */
// Socket.prototype.send = function (buf, host, port, cb) {
Socket.prototype.send = function (buffer,
                                  offset,
                                  length,
                                  port,
                                  address,
                                  callback) {

  var self = this
  buffer = helper.toBuffer(buffer)
  if (!callback) callback = function () {}

  if (offset !== 0)
    throw new Error('Non-zero offset not supported yet')

  if (self._bindState === BIND_STATE_UNBOUND)
    self.bind(0)

  if (self._bindState !== BIND_STATE_BOUND) {
    self._sendQueue.push([buffer, offset, length, port, address, callback])
    return
  }

  chrome.socket.sendTo(self.id, buffer, address, port, function (writeInfo) {
    if (writeInfo.bytesWritten < 0) {
      var ex = new Error('Socket ' + self.id + ' send eror ' + writeInfo.bytesWritten)
      callback(ex)
      self.emit('error', ex)
    } else {
      callback(null)
    }
  })
}

Socket.prototype._recvLoop = function() {
  var self = this

  chrome.socket.recvFrom(self.id, function (recvFromInfo) {
    if (recvFromInfo.resultCode === 0) {
      self.emit('close')

    } else if (recvFromInfo.resultCode < 0) {
      self.emit('error', new Error('Socket ' + self.id + ' recvFrom error ' +
          recvFromInfo.resultCode))

    } else {
      self.emit('message', new Uint8Array(recvFromInfo.data), recvFromInfo)
      self._recvLoop()
    }
  })
}