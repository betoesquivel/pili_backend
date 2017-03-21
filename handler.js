'use strict';

const R = require('ramda');
const graphql = require('graphql').graphql;
const uuid = require('uuid');
const shortid = require('shortid');
const dynamoBuilder = require('./dynamo_builder.js');
const AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
const db = new AWS.DynamoDB.DocumentClient();

const tools = require('graphql-tools');
const makeExecutableSchema = tools.makeExecutableSchema;
const addMockFunctionsToSchema = tools.addMockFunctionsToSchema;

const schemaString = `

type ShortURL {
  id: String!
  shortCode: String!
  url: String!
  owner: String
  visits: Int
  lastVisited: String
  lastUpdated: String
  createdOn: String
}

input ShortKeyQueryInput {
  shortCode: String
  owner: String
}

type Query {
  shortURLs(shortKey: ShortKeyQueryInput!): [ShortURL]
}

input NewShortURLInput {
  url: String!
  owner: String
}

input ShortKeyInput {
  shortCode: String!
  owner: String
}

type Mutation {
  createShortURL(newShort: NewShortURLInput!): ShortURL
  visitShortURL(shortKey: ShortKeyInput!): ShortURL
}

schema {
  query: Query
  mutation: Mutation
}

`;

const shortenURL = function shortenURL(urlAndOwner) {
  const now = new Date(Date.now());
  const nowStr = now.toISOString();
  const id = uuid();
  const shortCode = shortid.generate();
  return R.merge({
    id,
    shortCode,
    lastVisited: nowStr,
    lastUpdated: nowStr,
    createdOn: nowStr,
    visits: 0,
  }, urlAndOwner);
};

const shortKeyInputToShortURL = function shortCodeToShortURL(shortKey){
  const withOwner = R.merge(
    { owner: 'public' },
    shortKey
  );
  const shortURL = dynamoBuilder.shortURLsByOwner(withOwner, {})(db)
  return shortURL;
}

const resolvers = {
  Query: {
    shortURLs(obj, args) {
      const Keys = shortKeyInputToShortURL(args.shortKey)
        .then(R.pluck('id'))
        .then(R.map(R.objOf('id')))

      const fetchItem = Key => (
        dynamoBuilder.getItem(Key, {})(db)
      );
      const items = Keys
        .then(R.map(fetchItem));
      return items;
    },
  },
  Mutation: {
    createShortURL(obj, args) {
      const urlAndOwner = R.merge({
        owner: 'public',
      }, args.newShort);
      const shortURL = shortenURL(urlAndOwner);
      const putPromise =  dynamoBuilder.putItem(shortURL, {})(db);
      return putPromise;
    },
    visitShortURL(obj, args) {
      const shortURL = shortKeyInputToShortURL(args.shortKey)
        .then(R.last);
      const visit = shortURL
        .then((shortURL) => {
          if (R.isEmpty(shortURL)) {
            return {};
          } else {
            return dynamoBuilder.visitShortURL(R.pick(['id'], shortURL))(db);
          }
        });
      return visit;
    },
  },
};

const schema = makeExecutableSchema({
  resolvers,
  typeDefs: schemaString,
});

addMockFunctionsToSchema({
 schema,
 preserveResolvers: true,
});

module.exports.graphql = (event, context, callback) => {
  const safeJSONParse = R.tryCatch(JSON.parse, R.always({}));
  const parseJSONProp = R.compose(
    R.unless(R.is(Object), safeJSONParse),
    R.curry(R.propOr({}))
  );

  const body = parseJSONProp('body', event);
  const query = R.prop('query', body);
  const variables = parseJSONProp('variables', body);
  const queryPromise = graphql(schema, query, null, null, variables);

  const baseResponse = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };

  queryPromise
    .then(result => {
      const response = R.merge(baseResponse, {
        body: JSON.stringify(result),
      });

      callback(null, response);
    })
    .catch(e => callback(
      null,
      R.merge(baseResponse, {statusCode: 501, errorMessage: e})
    ));
};

module.exports.shortenURL = shortenURL;
