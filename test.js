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

R.tryCatch(JSON.parse, R.always({}))('')


var R = require('ramda');
var handler = require('./handler');
var shorten = handler.shortenURL;
var builder = require('./dynamo_builder.js')
var AWS = require('aws-sdk');
var db = new AWS.DynamoDB.DocumentClient();
var extract = r => this.r = r;
db
shorten

var shortURL = shorten({
  url: 'www.google.com',
  owner: 'public',
})
shortURL

builder.putItem(shortURL, {})(db).then(extract, extract);

builder.shortURLsByOwner({owner: 'public'}, {})(db).then(extract, extract);

builder.shortURLsByOwner({
  owner: 'public',
  shortCode: 'r1rhJgail'
}, {})(db).then(extract, extract);

var Key = {id: '1cf96fb9-4500-419b-bba5-0dc82092a444'}
Key

builder.visitShortURL(Key, {})(db).then(extract, extract)

r
