'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function dependentOf(dynamo)
 * Returns a prototypal dynamo model representing
 * the package that a given package is a dependent of
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the metadata of
 * the dependents of a single module.
 *
 */
module.exports = function dependentOf(dynamo) {
  const hashKey = 'pkg';
  const model = dynamo.define('DependentOf', {
    hashKey,
    tableName: 'WarehouseDependentOf',
    schema: {
      pkg: Joi.string(),
      dependentOf: Joi.string()
    }
  });
  return new Dynastar({ model, hashKey });
};
