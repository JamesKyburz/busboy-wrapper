var BusBoy = require('busboy')
var debug = require('debug')('busboy:upload')
var crypto = require('crypto')
var path = require('path')
var uuid = require('uuid')
var os = require('os')
var fs = require('fs')
var once = require('once')

module.exports = wrapper

function wrapper (q, opt, cb) {
  var busboy = new BusBoy({ headers: q.headers })

  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }

  cb = once(cb)
  opt = opt || {}

  var fields = {}
  var files = {}

  busboy.on('field', (name, value) => fields[name] = value)

  var filesWritten = 0
  var fileCount = 0

  busboy.on('file', (field, file, name) => {
    fileCount++
    var size = 0
    var sha1 = crypto.createHash('sha1')
    sha1.setEncoding('hex')

    var time = new Date()

    var tmpFile = path.join(opt.tempUploadDir || os.tmpDir(), uuid.v4()) + path.extname(name)
    var writeTo = fs.createWriteStream(tmpFile)
    writeTo.on('finish', () => {
      filesWritten++
      sha1.end()
      files[field] = {
        path: tmpFile,
        size: size,
        hash: sha1.read()
      }
      finished()
      var took = new Date() - time
      debug('%s file %s uploaded took %s ms', q.url, field, took)
    })
    file.on('error', assertError)
    writeTo.on('error', assertError)
    file.on('data', data => {
      sha1.write(data)
      writeTo.write(data)
      size += data.length
    })
    file.on('end', writeTo.end.bind(writeTo))
  })

  busboy.on('finish', finished)

  function finished () {
    if (fileCount === filesWritten && !finished.written) {
      cb(null, fields, files)
      finished.written = true
    }
  }

  q.pipe(busboy)

  function assertError (err) {
    if (!err) return
    debug('%s error occured %j', q.url, err)
    if (assertError.written) return
    cb(err)
    assertError.written = true
  }
}
