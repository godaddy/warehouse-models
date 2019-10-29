'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function dependentOf(dynamodb)
 * Returns a prototypal dynamodb model representing
 * the package that a given package is a dependent of
 * associated with the `dynamodb` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 *
 * @returns {Object} an dynamodb model representing the metadata of
 * the dependents of a single module.
 *
 */
module.exports = function dependentOf(dynamodb) {
  const hashKey = 'pkg';
  const model = dynamodb.define('DependentOf', {
    hashKey,
    tableName: 'WarehouseDependentOf',
    schema:{
      pkg: Joi.string(),
      dependentOf: Joi.string()
    }
  })
  return new Dynastar({model, hashKey})
};
