'use strict';

const Joi = require('joi');
const Compat = require('./compat');
var fetchFiles = require('./common').fetchFiles;

/**
 * function build(dynamodb)
 * Returns a prototypal dynamodb model representing
 * a built package being persisted to the connection
 * associated with the `dynamodb` instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an dynamodb model representing the metadata of
 * the a single build of a [env, package, version] tuple.
 *
 */
module.exports = function build(dynamodb, models) {
  const createKey = (data) => {
    return [data.env, data.name, data.version].join('!');
  }
  const rangeKey = 'locale';

  const model = dynamodb.define('Build', {
    hashKey: 'key',
    rangeKey,
    timestamps: true, // adds updatedAt and createdAt
    tableName: 'WarehouseBuild',
    schema: {
      key: Joi.string(),
      build_id: Joi.string(),
      previous_build_id: Joi.string(),
      rollback_build_ids: Joi.object().allow(null),
      locale: Joi.string(),
      env: Joi.string(),
      name: Joi.string(),
      version: Joi.string(),
      cdn_url: Joi.string(),
      fingerprints: dynamodb.types.stringSet(), // [sdf34u93fjk34j, lhe439843kjdsf]
      artifacts: dynamodb.types.stringSet(),    // [sdf34u93fjk34j/app.min.js, lhe439843kjdsf/app.js]
      recommended: dynamodb.types.stringSet()   // [sdf34u93fjk34j/appe.min.js]
    }
  });

  var Build = Compat(model, rangeKey, createKey);
  /**
   * Fetch the files based on the fingerprint
   */
  Build.prototype.fetchFiles = fetchFiles(models);
  return Build;
};
