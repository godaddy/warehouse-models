'use strict';

/**
 * function buildFile(datastar)
 * Returns a prototypal datastar model representing
 * a file within a built package being persisted
 * to the connection associated with the `datastar`
 * instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the metadata of
 * a single build file of a single version of a package
 *
 */
module.exports = function buildFile(datastar) {
  var cql = datastar.schema.cql;

  var BuildFile = datastar.define('build_file', {
    schema: datastar.schema.object({
      fingerprint: cql.text(),
      build_id: cql.text(),
      url: cql.text(),
      create_date: cql.timestamp({ default: 'create' }),
      env: cql.text(),
      locale: cql.text(),
      name: cql.text(),
      version: cql.text(),
      extension: cql.text(),
      source: cql.blob(),
      sourcemap: cql.blob(),
      shrinkwrap: cql.json(),
      filename: cql.text()
    }).partitionKey('fingerprint'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });

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
