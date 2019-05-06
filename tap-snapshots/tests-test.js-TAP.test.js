/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`tests/test.js TAP custom hash with sha256 > must match snapshot 1`] = `
{"fields":{},"files":{"license":{"name":"LICENSE",temporary-path,"size":1816,"hash":"a48cdb5cf55019972cab469173b77bb8adf67e6c9757e428018c4255649856f2","encoding":"7bit","mimetype":"application/octet-stream"}}}
`

exports[`tests/test.js TAP encoding and mimetype > must match snapshot 1`] = `
{"fields":{},"files":{"license":{"name":"LICENSE",temporary-path,"size":1816,"hash":"4f54dcf7b324c315b2cc2831b6b442515c7437c2","encoding":"7bit","mimetype":"application/octet-stream"},"readme.markdown":{"name":"readme.markdown",temporary-path,"size":875,"hash":"3464ea4de49b1283ed3289e931d20a612a6dafbf","encoding":"7bit","mimetype":"text/markdown"},"image.jpg":{"name":"image.jpg",temporary-path,"size":285,"hash":"d61302ba02a43ee2c9c6b4e4b254b60092434635","encoding":"7bit","mimetype":"image/jpeg"}}}
`

exports[`tests/test.js TAP multipart with fields and no file > must match snapshot 1`] = `
{"fields":{"field1":"test1","field2":"test2"},"files":{}}
`

exports[`tests/test.js TAP upload 2 files > must match snapshot 1`] = `
{"fields":{},"files":{"license":{"name":"LICENSE",temporary-path,"size":1816,"hash":"4f54dcf7b324c315b2cc2831b6b442515c7437c2","encoding":"7bit","mimetype":"application/octet-stream"},".gitignore":{"name":".gitignore",temporary-path,"size":49,"hash":"5deb8ce2d089fb11d9be6ab1e839f3a719a55915","encoding":"7bit","mimetype":"application/octet-stream"}}}
`

exports[`tests/test.js TAP upload license file > must match snapshot 1`] = `
{"fields":{"field":"test"},"files":{"license":{"name":"LICENSE",temporary-path,"size":1816,"hash":"4f54dcf7b324c315b2cc2831b6b442515c7437c2","encoding":"7bit","mimetype":"application/octet-stream"}}}
`

exports[`tests/test.js TAP upload license file testing promise api > must match snapshot 1`] = `
{"fields":{"field":"test"},"files":{"license":{"name":"LICENSE",temporary-path,"size":1816,"hash":"4f54dcf7b324c315b2cc2831b6b442515c7437c2","encoding":"7bit","mimetype":"application/octet-stream"}}}
`
