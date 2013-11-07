var browserify = require('browserify')
var cp = require('child_process')
var envify = require('envify/custom')
var fs = require('fs')
var once = require('once')
var path = require('path')

var CHROME = '/Applications/Google\\ Chrome\\ Canary.app/Contents/MacOS/Google\\ Chrome\\ Canary'
var BUNDLE_PATH = path.join(__dirname, '../example/chrome-app/bundle.js')

exports.browserify = function (filename, port, cb) {
  if (!cb) cb = function () {}
  cb = once(cb)

  var b = browserify()
  b.add(path.join(__dirname, '../example', filename))
  b.transform(envify({ PORT: port }))

  b.bundle()
    .pipe(fs.createWriteStream(BUNDLE_PATH))
    .on('close', cb)
    .on('error', cb)
}

exports.launchBrowser = function () {
  var command = CHROME + ' --load-and-launch-app=example/chrome-app'
  var env = { cwd: path.join(__dirname, '..') }

  return cp.exec(command, env, function () {})
}