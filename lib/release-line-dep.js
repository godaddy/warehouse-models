'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function releaseLineDep(dynamodb)
 * Returns a prototypal dynamodb model representing
 * the dependents of a package for a specific release
 * associated with the `dynamodb` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 *
 * @returns {Object} an dynamodb model representing the release line
 */
module.exports = function releaseLineDep(dynamodb) {
  const createKey = (data) => {
    return [data.pkg, data.version].join('!');
  }
  const rangeKey = 'dependent';
  const model = dynamodb.define('ReleaseLineDep', {
    hashKey: '',
    rangeKey,
    tableName: 'WarehouseReleaseLineDep',
    schema: {
      pkg: Joi.string(),
      previousVersion: Joi.string(),
      version: Joi.string(),
      dependent: Joi.string(),
      dependentVersion: Joi.string()
    }
  });

  return new Dynastar({model, rangeKey, createKey});
};
