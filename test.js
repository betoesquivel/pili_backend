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
