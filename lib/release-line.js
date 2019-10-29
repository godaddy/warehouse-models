'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function releaseLine(dynamodb)
 * Returns a prototypal dynamodb model representing
 * the release line of a given package and version
 * associated with the `dynamodb` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 *
 * @returns {Object} an dynamodb model representing the release line
 */
module.exports = function releaseLine(dynamodb) {
  const createKey = (data) => {
    return [data.pkg, data.version].join('!');
  }
  const model = dynamodb.define('ReleaseLine', {
    hashKey: 'key',
    tableName: 'WarehouseReleaseLine',
    schema: {
      key: Joi.string(),
      pkg: Joi.string(),
      previousVersion: Joi.string(),
      version: Joi.string()
    }
  });

  return new Dynastar({model, createKey});
};
