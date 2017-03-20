'use strict';

const R = require('ramda');

const dynamoCall = function dynamoCall(action, actionParams, customParams) {
  const params = R.mergeAll([
    { TableName: 'ShortURLs' },
    actionParams,
    customParams,
  ]);
  return db => db[action](params).promise();
};

const putItem = function putItem(item, customParams) {
  const params = {
    Item: item,
  };
  return db => dynamoCall(
    'put',
    params,
    customParams
  )(db).then(R.always(item));
};

const getItem = function getItem(Key, customParams) {
  const params = {
    Key,
  };
  return db => dynamoCall(
    'get',
    params,
    customParams
  )(db).then(R.prop('Item'));
};

const shortURLsByOwner = function shortURLsByOwner(shortKey, queryParams) {
  const owner = R.propOr('public', 'owner', shortKey);
  const shortCode = R.propOr('', 'shortCode', shortKey);
  let KeyConditionExpression = '#owner = :owner';
  let ExpressionAttributeValues = {
    ':owner': owner,
  };
  let ExpressionAttributeNames = {
    '#owner': 'owner',
  };
  if (!R.isEmpty(shortCode)) {
    KeyConditionExpression += ' and #shortCode = :shortCode';
    ExpressionAttributeNames = R.assoc(
      '#shortCode', 'shortCode',
      ExpressionAttributeNames
    );
    ExpressionAttributeValues = R.assoc(
      ':shortCode', shortCode,
      ExpressionAttributeValues
    );
  }

  const params = {
    IndexName: 'OwnerShortCode',
    KeyConditionExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  };
  return db => dynamoCall(
    'query',
    params,
    queryParams
  )(db).then(R.prop('Items'));
};

module.exports = {
  putItem,
  getItem,
  shortURLsByOwner,
};
