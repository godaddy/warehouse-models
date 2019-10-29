'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');
/**
 * function dependent(dynamodb)
 * Returns a prototypal dynamodb model representing
 * the dependents of a package being persisted to the
 * connection associated with the `dynamodb` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 *
 * @returns {Object} an dynamodb model representing the metadata of
 * the dependents of a single module.
 *
 */
module.exports = function dependent(dynamodb) {
  const hashKey = 'name'
  const model = dynamodb.define('Dependent', {
    hashKey,
    tableName: 'WarehouseDependent',
    schema: {
      name: Joi.string(),
      dependents: dynamo.types.stringSet()
    }
  });
  return new Dynastar({model, hashKey})
};
