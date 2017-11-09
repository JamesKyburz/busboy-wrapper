const BusBoy = require('busboy')
const debug = require('debug')('busboy:upload')
const crypto = require('crypto')
const path = require('path')
const uuid = require('uuid')
const os = require('os')
const fs = require('fs')
const once = require('once')

module.exports = wrapper

function wrapper (q, opt, cb) {
  const busboy = new BusBoy({ headers: q.headers })

  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }

  cb = once(cb)
  opt = opt || {}

  const fields = {}
  const files = {}

  busboy.on('field', (name, value) => {
    fields[name] = value
  })

  let filesWritten = 0
  let fileCount = 0

  busboy.on('file', (field, file, name) => {
    fileCount++
    let size = 0
    const sha1 = crypto.createHash('sha1')
    sha1.setEncoding('hex')

    const time = new Date()

    const tmpFile = path.join(opt.tempUploadDir || os.tmpdir(), uuid.v4()) + path.extname(name)
    const writeTo = fs.createWriteStream(tmpFile)
    writeTo.on('finish', () => {
      filesWritten++
      sha1.end()
      files[field] = {
        name: name,
        path: tmpFile,
        size: size,
        hash: sha1.read()
      }
      finished()
      const took = new Date() - time
      debug('%s file %s uploaded took %s ms', q.url, field, took)
    })
    file.on('error', assertError)
    writeTo.on('error', assertError)
    file.on('data', (data) => {
      sha1.write(data)
      writeTo.write(data)
      size += data.length
    })
    file.on('end', writeTo.end.bind(writeTo))
  })

  busboy.on('finish', finished.bind(null, true))
  function finished (parseComplete) {
    if (parseComplete) finished.parseComplete = true
    if (fileCount === filesWritten && !finished.written && finished.parseComplete) {
      cb(null, fields, files)
      finished.written = true
      debug('%s completed %j', q.url, { fields: fields, files: files })
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
