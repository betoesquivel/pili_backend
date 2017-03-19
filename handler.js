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

schema {
  query: Query
}

`;

const schema = makeExecutableSchema({
  typeDefs: schemaString,
});

addMockFunctionsToSchema({ schema });

const queryTest = `
query shortToUrl($shortCode: String) {
  shortToURL(short: $shortCode) {
    shortCode,
    url,
  }
}
`;

const variablesTest = { shortCode: 'short' };

module.exports.response = graphql(schema, queryTest, variablesTest);

module.exports.graphql = (event, context, callback) => {
  const parseBody = R.compose(
    JSON.parse,
    R.prop('body')
  );

  const body = parseBody(event);
  const query = R.prop('query', body);
  const variables = R.prop('variables', body);
  const queryPromise = graphql(schema, query, variables);

  queryPromise.then(result => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        query: query,
        variables: variables,
        result: result,
      }),
    };

    callback(null, response);
  });
};
