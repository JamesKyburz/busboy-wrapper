const BusBoy = require('busboy')
const debug = require('debug')('busboy:upload')
const crypto = require('crypto')
const path = require('path')
const uuid = require('uuid')
const os = require('os')
const fs = require('fs')
const once = require('once')

module.exports = wrapper

function wrapper (req, opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }

  if (!cb) {
    return new Promise((resolve, reject) =>
      wrapper(req, opt, (err, result) => (err ? reject(err) : resolve(result)))
    )
  }

  opt = opt || {}

  cb = once(cb)

  let busboy

  try {
    busboy = new BusBoy({ headers: req.headers })
  } catch (err) {
    cb(err)
    return
  }

  const fields = {}
  const files = {}

  const createHash =
    opt.createHash ||
    (() => {
      const sha1 = crypto.createHash('sha1')
      sha1.setEncoding('hex')
      return sha1
    })

  busboy.on('error', cb)

  busboy.on('field', (name, value) => {
    fields[name] = value
  })

  let filesWritten = 0
  let fileCount = 0

  busboy.on('file', (field, file, name, encoding, mimetype) => {
    fileCount++
    let size = 0

    const hash = createHash()

    const time = new Date()

    if (!name) name = field

    const tmpFile =
      path.join(opt.tempUploadDir || os.tmpdir(), uuid.v4()) +
      path.extname(name)
    const writeTo = fs.createWriteStream(tmpFile)
    writeTo.on('finish', () => {
      filesWritten++
      hash.end()
      files[field] = {
        name,
        path: tmpFile,
        size,
        hash: hash.read(),
        encoding,
        mimetype
      }
      finished()
      const took = new Date() - time
      debug('%s file %s uploaded took %s ms', req.url, field, took)
    })
    file.on('error', assertError)
    writeTo.on('error', assertError)
    file.on('data', data => {
      hash.write(data)
      writeTo.write(data)
      size += data.length
    })
    file.on('end', writeTo.end.bind(writeTo))
  })

  busboy.on('finish', finished.bind(null, true))
  function finished (parseComplete) {
    if (parseComplete) finished.parseComplete = true
    if (
      fileCount === filesWritten &&
      !finished.written &&
      finished.parseComplete
    ) {
      const sortedFiles = Object.keys(files)
        .sort()
        .reduce((sum, key) => {
          sum[key] = files[key]
          return sum
        }, {})
      cb(null, { fields, files: sortedFiles })
      finished.written = true
      debug('%s completed %j', req.url, { fields, files: sortedFiles })
    }
  }

  req.pipe(busboy)

  function assertError (err) {
    debug('%s error occured %j', req.url, err)
    cb(err)
  }
}
