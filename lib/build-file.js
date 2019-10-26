'use strict';

/**
 * function buildFile(dynamodb)
 * Returns a prototypal dynamodb model representing
 * a file within a built package being persisted
 * to the connection associated with the `dynamodb`
 * instance provided.
 *
 * @param {dynamodb} dynamodb Instance of dynamodb to attach to.
 *
 * @returns {Object} an dynamodb model representing the metadata of
 * a single build file of a single version of a package
 *
 */
module.exports = function buildFile(dynamodb) {
  const createKey = (data) => {
    return data.fingerprint + '!';
  };

  const model = dynamo.define('build_file', {
    hashKey: 'key',
    rangeKey,
    timestamps: true, // adds updatedAt and createdAt
    tableName: 'WarehouseBuildHead',
    schema: {
      key: Joi.string(),
      fingerprint: Joi.string(),
      build_id: Joi.string(),
      url: Joi.string(),
      env: Joi.string(),
      locale: Joi.string(),
      name: Joi.string(),
      version: Joi.string(),
      extension: cql.text(),
      filename: Joi.string()
    }
  });

  var BuildFile = new Compat({ model, undefined, createKey });

  //
  // Deserialize function for a buildFile to turn the blobs into strings
  //
  BuildFile.deserialize = function (results) {
    var array = true;
    if (!results) { return; }
    if (!Array.isArray(results)) {
      results = [results];
      array = false;
    }

    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      result.source = result.source && result.source.toString('utf8');
      result.sourcemap = result.sourcemap && result.sourcemap.toString('utf8');
    }

    return array ? results : results[0];
  };

  return BuildFile;
};
