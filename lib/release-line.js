'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function releaseLine(dynamo)
 * Returns a prototypal dynamo model representing
 * the release line of a given package and version
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the release line
 */
module.exports = function releaseLine(dynamo) {
  const createKey = (data) => {
    return [data.pkg, data.version].join('!');
  };
  const model = dynamo.define('ReleaseLine', {
    hashKey: 'key',
    tableName: 'WrhsReleaseLine',
    schema: {
      key: Joi.string(),
      pkg: Joi.string(),
      previousVersion: Joi.string().allow(null),
      version: Joi.string()
    }
  });

  return new Dynastar({ model, createKey });
};
