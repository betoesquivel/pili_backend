'use strict';

const R = require('ramda');
//const graphql = require('graphql').graphql;

//const tools = require('graphql-tools');
//const makeExecutableSchema = tools.makeExecutableSchema;
//const addMockFunctionsToSchema = tools.addMockFunctionsToSchema;

//const schemaString = `

//`;

//const schema = makeExecutableSchema({
  //typeDefs: schemaString,
//});

//addMockFunctionsToSchema({ schema });

//const query = `
//query something {

//}
//`;

module.exports.graphql = (event, context, callback) => {
  const getQuery = R.compose(
    R.prop('query'),
    JSON.parse,
    R.prop('body')
  );
  const query = getQuery(event);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Query received:${query}`,
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
