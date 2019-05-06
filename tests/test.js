const tap = require('tap')
const FormData = require('form-data')
const fs = require('fs')
const concat = require('concat-stream')
const busboy = require('../')
const listen = require('test-listen-destroy')
const crypto = require('crypto')
const http = require('http')
const { parse: urlParse } = require('url')

tap.cleanSnapshot = s => {
  return s.replace(/"path":"[^"]*"/g, 'temporary-path')
}

const { test } = tap

const fn = (req, res, opt = {}) => {
  busboy(req, opt, (err, payload) => {
    if (err) {
      res.writeHead(500)
      res.end(err.toString())
    } else {
      res.end(JSON.stringify(payload))
    }
  })
}

const fnPromise = (req, res, opt = {}) => {
  busboy(req, opt)
    .then(payload => res.end(JSON.stringify(payload)))
    .catch(err => {
      res.writeHead(500)
      res.end(err.toString())
    })
}
const ssri = require('ssri')

test('upload license file', async t => {
  const form = new FormData()
  form.append('field', 'test')
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen(fn)

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          t.matchSnapshot(result.toString())
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('upload license file testing promise api', async t => {
  const form = new FormData()
  form.append('field', 'test')
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen(fnPromise)

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          t.matchSnapshot(result.toString())
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('multipart with fields and no file', async t => {
  const form = new FormData()
  form.append('field1', 'test1')
  form.append('field2', 'test2')

  const url = await listen(fn)

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          t.matchSnapshot(result.toString())
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('upload 2 files', async t => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')
  form.append('.gitignore', fs.createReadStream('./.gitignore'), '.gitignore')

  const url = await listen(fn)

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          t.matchSnapshot(result.toString())
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('encoding and mimetype', async t => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')
  form.append(
    'readme.markdown',
    fs.createReadStream('./readme.markdown'),
    'readme.markdown'
  )
  form.append(
    'image.jpg',
    fs.createReadStream('./tests/image.jpg'),
    'image.jpg'
  )

  const url = await listen(fn)

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          t.matchSnapshot(result.toString())
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('custom hash with ssri', async t => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen((req, res) =>
    fn(req, res, {
      createHash () {
        const integrity = ssri.create()
        let hash
        return {
          write (data) {
            integrity.update(data)
          },
          end () {
            hash = integrity.digest().toString()
          },
          read () {
            return hash
          }
        }
      }
    })
  )

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          const json = JSON.parse(result)
          t.equals(
            json.files.license.hash,
            'sha512-gXfBuvgk+pEQjYxFnX4J+4jGSLkxxgwe0xufjULsQCjqXF26HkJV0KYXx8Uxl1Ta/dZfURsRbXlAOir+AM07Zw==',
            'license hash is correct'
          )
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('custom hash with sha256', async t => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen((req, res) =>
    fn(req, res, {
      createHash () {
        const sha256 = crypto.createHash('sha256')
        sha256.setEncoding('hex')
        return sha256
      }
    })
  )

  await new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) return reject(err)
      t.equals(res.statusCode, 200, 'server response is 200')
      res.pipe(
        concat(result => {
          t.matchSnapshot(result.toString())
          resolve()
        })
      )
      res.resume()
    })
  })
})

test('corrupt multipart', async t => {
  const url = await listen(fn)

  await new Promise((resolve, reject) => {
    const request = http.request(
      {
        ...urlParse(url),
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data; boundar'
        }
      },
      res => {
        t.equals(res.statusCode, 500, 'server response is 500')
        resolve()
      }
    )
    request.end()
  })
})
