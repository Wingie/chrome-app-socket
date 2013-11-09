exports.dgram = require('./lib/dgram')

var tcp = require('./lib/tcp')
exports.TCPSocket = tcp.TCPSocket
exports.TCPListenSocket = tcp.TCPListenSocket
