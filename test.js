const test = require('tape')
const FormData = require('form-data')
const fs = require('fs')
const concat = require('concat-stream')
const busboy = require('./')
const listen = require('test-listen-destroy')
const fn = (req, res) => {
  busboy(req, (err, fields, files) => {
    if (err) {
      res.writeHead(500)
      res.end(err.toString())
    } else {
      res.end(JSON.stringify({ fields, files }))
    }
  })
}

test('upload license file', async (t) => {
  const form = new FormData()
  form.append('field', 'test')
  form.append('license', fs.createReadStream('./LICENSE'))

  const url = await listen(fn)

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(Object.keys(json.fields).length, 1, 'one field in response')
      t.equals(json.fields.field, 'test', 'field = test')
      t.equals(Object.keys(json.files).length, 1, 'one file in response')
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
  form.append('license', fs.createReadStream('./LICENSE'))
  form.append('.gitignore', fs.createReadStream('./.gitignore'))

  const url = await listen(fn)

  form.submit(url, (err, res) => {
    t.error(err, 'server returned a reponse')
    t.equals(res.statusCode, 200, 'server response is 200')
    res.pipe(concat((result) => {
      const json = JSON.parse(result)
      t.equals(Object.keys(json.fields).length, 0, 'no fields in response')
      t.equals(Object.keys(json.files).length, 2, 'two files in response')
      t.ok(json.files.license.path, 'license path is set')
      t.equals(json.files.license.hash, '4f54dcf7b324c315b2cc2831b6b442515c7437c2', 'license hash is correct')
      t.equals(json.files.license.size, 1816, 'license size is correct')
      t.ok(json.files['.gitignore'].path, '.gitignore path is set')
      t.equals(json.files['.gitignore'].hash, 'ff380f2f53c3fe4926936611cfbeda4296a539bc', '.gitignore hash is correct')
      t.equals(json.files['.gitignore'].size, 36, '.gitignore size is correct')
      t.end()
    }))
    res.resume()
  })
})
