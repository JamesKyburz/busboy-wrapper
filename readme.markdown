# busboy-wrapper

busboy multi part file wrapper

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

main.js:

```javascript
var busboy = require('busboy-wrapper')
function upload (q, r) {
  busboy(q, (err, fields, files) => {
  })
}

```
# install

With [npm](https://npmjs.org) do:

```
npm install busboy-wrapper
```

# license

MIT
