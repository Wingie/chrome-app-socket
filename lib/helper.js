var bops = require('bops')

exports.toBuffer = function (data) {
  if (typeof data === 'string') {
    return bops.from(data).buffer

  } else if (bops.is(data)) {
    // If data is a TypedArrayView (Uint8Array) then copy the buffer, so the
    // underlying buffer will be exactly the right size. We care about this
    // because the Chrome `sendTo` function will be passed the underlying
    // ArrayBuffer.
    var newBuf = bops.create(data.length)
    bops.copy(data, newBuf, 0, 0, data.length)
    return newBuf.buffer

  } else if (data.buffer) {
    return data.buffer

  } else if (data instanceof ArrayBuffer) {
    return data

  } else {
    throw new Error('Cannot convert data to ArrayBuffer type')
  }

}