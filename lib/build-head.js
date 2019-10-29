'use strict';

var fetchFiles = require('./common').fetchFiles;
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function buildHead(dynamodb)
 * Returns a prototypal dynamodb model representing
 * HEAD of a built package being persisted to the connection
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an dynamodb model representing the metadata of
 * the latest build (i.e. HEAD) of a [env, package] pair
 */
module.exports = function buildHead(dynamodb, models) {
  const createKey = (data) => {
    return [data.env, data.name].join('!');
  };
  const rangeKey = 'locale';

  const model = dynamodb.define('BuildHead', {
    hashKey: 'key',
    rangeKey,
    timestamps: true, // adds updatedAt and createdAt
    tableName: 'WarehouseBuildHead',
    schema: {
      key: Joi.string(),
      env: Joi.string(),
      name: Joi.string(),
      buildId: Joi.string(),
      previousBuildId: Joi.string(),
      rollbackBuildIds: Joi.object().allow(null),
      version: Joi.string(),
      locale: Joi.string(),
      cdnUrl: Joi.string(), // URL of CDN to be used as a base for all the artifacts
      fingerprints: dynamodb.types.stringSet(),
      artifacts: dynamodb.types.stringSet(),
      recommended: dynamodb.types.stringSet()
    }
  });

  var BuildHead = new Dynastar({ model, rangeKey, createKey });

  //
  // Create the assigned function on the prototype to fetchFiles based on the
  // state of the instance
  //
  BuildHead.prototype.fetchFiles = fetchFiles(models);

  return BuildHead;
};
