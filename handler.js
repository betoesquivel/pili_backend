'use strict';

const R = require('ramda');
const graphql = require('graphql').graphql;

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

type Query {
  shortURLs: [ShortURL]
  shortToURL(short: String): ShortURL
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

const schema = makeExecutableSchema({
  typeDefs: schemaString,
});

addMockFunctionsToSchema({ schema });

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
