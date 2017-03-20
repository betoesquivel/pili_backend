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

input ShortKeyInput {
  shortCode: String!
  owner: String
}

type Query {
  shortURLs(owner: String): [ShortURL]
  shortToURL(shortKey: ShortKeyInput!): ShortURL
}

input NewShortURLInput {
  url: String!
  owner: String
}

type Mutation {
  createShortURL(newShort: NewShortURLInput!): ShortURL
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

const resolvers = {
  Query: {
    shortURLs(obj, args) {
      const owner = R.propOr('public', 'owner', args);
      const request = dynamoBuilder.shortURLsByOwner({owner}, {})(db);
      return request;
    },
    shortToURL(obj, args) {
      const withOwner = R.merge(
        { owner: 'public' },
        args
      );
      const request = dynamoBuilder.shortURLsByOwner(withOwner, {})(db);
      return request.then(R.last);
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
    }
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

  queryPromise.then(result => {
    const responseBody = { query, variables, result };
    const response = {
      statusCode: 200,
      body: JSON.stringify(responseBody),
    };

    callback(null, response);
  }).catch(callback);
};

module.exports.shortenURL = shortenURL;
