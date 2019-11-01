'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function releaseLineHead(dynamo)
 * Returns a prototypal dynamo model representing
 * the release line head of a given package
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the release line head
 */
module.exports = function releaseLineHead(dynamo) {
  const hashKey = 'pkg';
  const model = dynamo.define('ReleaseLineHead', {
    hashKey,
    tableName: 'WarehouseReleaseLineHead',
    schema: {
      pkg: Joi.string(),
      previousVersion: Joi.string(),
      version: Joi.string()
    }
  });
  return new Dynastar({ model, hashKey });
};
