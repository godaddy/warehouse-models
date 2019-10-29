'use strict';
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function releaseLineHead(dynamodb)
 * Returns a prototypal dynamodb model representing
 * the release line head of a given package
 * associated with the `dynamodb` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 *
 * @returns {Object} an dynamodb model representing the release line head
 */
module.exports = function releaseLineHead(dynamodb) {
  const hashKey = 'pkg'
  const model = dynamodb.define('ReleaseLineHead',{
    hashKey,
    tableName: 'WarehouseReleaseLineHead',
    schema: {
      pkg: Joi.string(),
      previousVersion: Joi.string(),
      version: Joi.string()
    }
  });
  return new Dynastar({model, hashKey });
};
