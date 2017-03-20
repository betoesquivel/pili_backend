const handler = require('./handler.js');
const extract = r => this.r = r;
handler.response.then(extract, extract);
handler

var event = {
  body: JSON.stringify({
    "query": " query shortToUrl($shortCode: String) { shortToURL(short: $shortCode) { shortCode, url, } } ",
    "variables": {
      "shortCode": "short"
    },
  })
}

handler.graphql(event, null, (e, d) => extract(d))

r

var R = require('ramda');
var parseJSONProp = R.compose(R.tryCatch(JSON.parse, R.always({})),
  R.curry(R.propOr(null)));

parseJSONProp('something', {something: ''})

R.curry(R.propOr(null))('aProp', {})

R.tryCatch(JSON.parse, R.)('')
