const test = require('tape')
const FormData = require('form-data')
const fs = require('fs')
const concat = require('concat-stream')
const busboy = require('../')
const listen = require('test-listen-destroy')
const crypto = require('crypto')

const fn = (req, res, opt = {}) => {
  busboy(req, opt, (err, fields, files) => {
    if (err) {
      res.writeHead(500)
      res.end(err.toString())
    } else {
      res.end(JSON.stringify({ fields, files }))
    }
  })
}
const ssri = require('ssri')

test('upload license file', async (t) => {
  const form = new FormData()
  form.append('field', 'test')
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen(fn)

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(Object.keys(json.fields).length, 1, 'one field in response')
      t.equals(json.fields.field, 'test', 'field = test')
      t.equals(Object.keys(json.files).length, 1, 'one file in response')
      t.equals(json.files.license.name, 'LICENSE', 'license name is correct')
      t.ok(json.files.license.path, 'path is set')
      t.equals(json.files.license.hash, '4f54dcf7b324c315b2cc2831b6b442515c7437c2', 'license hash is correct')
      t.equals(json.files.license.size, 1816, 'license size is correct')
      t.end()
    }))
    res.resume()
  })
})

test('multipart with fields and no file', async (t) => {
  const form = new FormData()
  form.append('field1', 'test1')
  form.append('field2', 'test2')

  const url = await listen(fn)

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(Object.keys(json.fields).length, 2, 'two fields in response')
      t.equals(json.fields.field1, 'test1', 'field1 = test1')
      t.equals(json.fields.field2, 'test2', 'field2 = test2')
      t.equals(Object.keys(json.files).length, 0, 'no files in response')
      t.end()
    }))
    res.resume()
  })
})

test('upload 2 files', async (t) => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')
  form.append('.gitignore', fs.createReadStream('./.gitignore'), '.gitignore')

  const url = await listen(fn)

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(Object.keys(json.fields).length, 0, 'no fields in response')
      t.equals(Object.keys(json.files).length, 2, 'two files in response')
      t.ok(json.files.license.path, 'license path is set')
      t.equals(json.files.license.name, 'LICENSE', 'license name is correct')
      t.equals(json.files.license.hash, '4f54dcf7b324c315b2cc2831b6b442515c7437c2', 'license hash is correct')
      t.equals(json.files.license.size, 1816, 'license size is correct')
      t.equals(json.files['.gitignore'].name, '.gitignore', '.gitignore name is correct')
      t.ok(json.files['.gitignore'].path, '.gitignore path is set')
      t.equals(json.files['.gitignore'].hash, 'b026f212ac92d67fd5cdcce2ef34f1a3b15c3de5', '.gitignore hash is correct')
      t.equals(json.files['.gitignore'].size, 37, '.gitignore size is correct')
      t.end()
    }))
    res.resume()
  })
})

test('encoding and mimetype', async (t) => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')
  form.append('readme.markdown', fs.createReadStream('./readme.markdown'), 'readme.markdown')
  form.append('image.jpg', fs.createReadStream('./tests/image.jpg'), 'image.jpg')

  const url = await listen(fn)

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(json.files['license'].mimetype, 'application/octet-stream', 'license mimetype')
      t.equals(json.files['readme.markdown'].mimetype, 'text/x-markdown', 'readme mimetype')
      t.equals(json.files['license'].encoding, '7bit', 'license mimetype')
      t.equals(json.files['readme.markdown'].encoding, '7bit', 'readme mimetype')
      t.equals(json.files['image.jpg'].mimetype, 'image/jpeg', 'image mimetype')
      t.equals(json.files['image.jpg'].encoding, '7bit', 'image mimetype')
      t.end()
    }))
    res.resume()
  })
})

test('custom hash with ssri', async (t) => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen((req, res) => fn(req, res, {
    createHash () {
      const integrity = ssri.create()
      let hash
      return {
        write (data) { integrity.update(data) },
        end () { hash = integrity.digest().toString() },
        read () { return hash }
      }
    }
  }))

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(json.files.license.hash, 'sha512-gXfBuvgk+pEQjYxFnX4J+4jGSLkxxgwe0xufjULsQCjqXF26HkJV0KYXx8Uxl1Ta/dZfURsRbXlAOir+AM07Zw==', 'license hash is correct')
      t.end()
    }))
    res.resume()
  })
})

test('custom hash with sha256', async (t) => {
  const form = new FormData()
  form.append('license', fs.createReadStream('./LICENSE'), 'LICENSE')

  const url = await listen((req, res) => fn(req, res, {
    createHash () {
      const sha256 = crypto.createHash('sha256')
      sha256.setEncoding('hex')
      return sha256
    }
  }))

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(json.files.license.hash, 'a48cdb5cf55019972cab469173b77bb8adf67e6c9757e428018c4255649856f2', 'license hash is correct')
      t.end()
    }))
    res.resume()
  })
})
