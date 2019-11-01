'use strict';

const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function build(dynamo)
 * Returns a prototypal dynamo model representing
 * a built package being persisted to the connection
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the metadata of
 * the a single build of a [env, package, version] tuple.
 *
 */
module.exports = function build(dynamo) {
  const createKey = (data) => {
    return [data.env, data.name, data.version].join('!');
  };
  const rangeKey = 'locale';

  const model = dynamo.define('Build', {
    hashKey: 'key',
    rangeKey,
    timestamps: true, // adds updatedAt and createdAt
    tableName: 'WarehouseBuild',
    schema: {
      key: Joi.string(),
      buildId: Joi.string(),
      previousBuildId: Joi.string(),
      rollbackBuildIds: Joi.object().allow(null),
      locale: Joi.string(),
      env: Joi.string(),
      name: Joi.string(),
      version: Joi.string(),
      cdnUrl: Joi.string(),
      fingerprints: dynamo.types.stringSet(), // [sdf34u93fjk34j, lhe439843kjdsf]
      artifacts: dynamo.types.stringSet(),    // [sdf34u93fjk34j/app.min.js, lhe439843kjdsf/app.js]
      recommended: dynamo.types.stringSet()   // [sdf34u93fjk34j/appe.min.js]
    }
  });

  var Build = new Dynastar({ model, rangeKey, createKey });
  return Build;
};
