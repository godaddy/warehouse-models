'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');
/**
 * function dependent(dynamo)
 * Returns a prototypal dynamo model representing
 * the dependents of a package being persisted to the
 * connection associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the metadata of
 * the dependents of a single module.
 *
 */
module.exports = function dependent(dynamo) {
  const hashKey = 'name';
  const model = dynamo.define('Dependent', {
    hashKey,
    tableName: 'WrhsDependent',
    schema: {
      name: Joi.string(),
      dependents: dynamo.types.stringSet()
    }
  });
  return new Dynastar({ model, hashKey });
};
