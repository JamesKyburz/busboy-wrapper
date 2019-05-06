# busboy-wrapper

busboy multi part file wrapper

[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![build status](https://api.travis-ci.org/JamesKyburz/busboy-wrapper.svg)](https://travis-ci.org/JamesKyburz/busboy-wrapper)
[![npm](https://img.shields.io/npm/v/busboy-wrapper.svg)](https://npmjs.org/package/busboy-wrapper)
[![downloads](https://img.shields.io/npm/dm/busboy-wrapper.svg)](https://npmjs.org/package/busboy-wrapper)
[![Greenkeeper badge](https://badges.greenkeeper.io/JamesKyburz/busboy-wrapper.svg)](https://greenkeeper.io/)

http-server.js:

```javascript
const busboy = require('busboy-wrapper')
async function upload (req, res) {
  const { fields, files } = await busboy(req)
}
```
# install

With [npm](https://npmjs.org) do:

```
npm install busboy-wrapper
```

# license

MIT
