'use strict';

const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function buildHead(dynamo)
 * Returns a prototypal dynamo model representing
 * HEAD of a built package being persisted to the connection
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an dynamo model representing the metadata of
 * the latest build (i.e. HEAD) of a [env, package] pair
 */
module.exports = function buildHead(dynamo, models) {
  const createKey = (data) => {
    return [data.env, data.name].join('!');
  };
  const rangeKey = 'locale';

  const model = dynamo.define('BuildHead', {
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
      fingerprints: dynamo.types.stringSet(),
      artifacts: dynamo.types.stringSet(),
      recommended: dynamo.types.stringSet()
    }
  });

  var BuildHead = new Dynastar({ model, rangeKey, createKey });

  return BuildHead;
};
