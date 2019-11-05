'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function buildFile(dynamo)
 * Returns a prototypal dynamo model representing
 * a file within a built package being persisted
 * to the connection associated with the `dynamo`
 * instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the metadata of
 * a single build file of a single version of a package
 *
 */
module.exports = function buildFile(dynamo) {
  const hashKey = 'fingerprint';
  const model = dynamo.define('BuildFile', {
    hashKey,
    timestamps: true, // adds updatedAt and createdAt
    tableName: 'WrhsBuildFile',
    schema: {
      fingerprint: Joi.string(),
      buildId: Joi.string(),
      url: Joi.string(),
      env: Joi.string(),
      locale: Joi.string(),
      name: Joi.string(),
      version: Joi.string(),
      extension: Joi.string(),
      filename: Joi.string()
    }
  });

  var BuildFile = new Dynastar({ model, hashKey });

  return BuildFile;
};
