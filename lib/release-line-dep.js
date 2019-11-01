'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function releaseLineDep(dynamo)
 * Returns a prototypal dynamo model representing
 * the dependents of a package for a specific release
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the release line
 */
module.exports = function releaseLineDep(dynamo) {
  const createKey = (data) => {
    return [data.pkg, data.version].join('!');
  };
  const rangeKey = 'dependent';
  const model = dynamo.define('ReleaseLineDep', {
    hashKey: 'key',
    rangeKey,
    tableName: 'WarehouseReleaseLineDep',
    schema: {
      key: Joi.string(),
      pkg: Joi.string(),
      previousVersion: Joi.string(),
      version: Joi.string(),
      dependent: Joi.string(),
      dependentVersion: Joi.string()
    }
  });

  return new Dynastar({ model, rangeKey, createKey });
};
