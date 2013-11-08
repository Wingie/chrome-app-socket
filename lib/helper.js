var bops = require('bops')

exports.toBuffer = function (data) {
  if (typeof data === 'string') {
    data = bops.from(data)
  } else if (bops.is(data)) {
    // If data is a TypedArrayView (Uint8Array) then copy the buffer, so the
    // underlying buffer will be exactly the right size. We care about this
    // because the Chrome `sendTo` function will be passed the underlying
    // ArrayBuffer.
    var newBuf = bops.create(data.length)
    bops.copy(data, newBuf, 0, 0, data.length)
    data = newBuf
  }

  if (data.buffer) {
    data = data.buffer
  }

  return data
}