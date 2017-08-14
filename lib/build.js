'use strict';

var fetchFiles = require('./common').fetchFiles;

/**
 * function build(datastar)
 * Returns a prototypal datastar model representing
 * a built package being persisted to the connection
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an datastar model representing the metadata of
 * the a single build of a [env, package, version] tuple.
 *
 */
module.exports = function build(datastar, models) {
  var cql = datastar.schema.cql;
  var Build = datastar.define('build', {
    schema: datastar.schema.object({
      build_id: cql.text(),
      previous_build_id: cql.text(),
      rollback_build_ids: cql.map(cql.text(), cql.text()), // timestamp is stored as text
      locale: cql.text(),
      create_date: cql.timestamp({ default: 'create' }),
      env: cql.text(),                   // prod
      name: cql.text(),
      version: cql.text(),
      value: cql.text(),
      cdn_url: cql.text(),
      fingerprints: cql.set(cql.text()), // [sdf34u93fjk34j, lhe439843kjdsf]
      artifacts: cql.set(cql.text()),    // [sdf34u93fjk34j/app.min.js, lhe439843kjdsf/app.js]
      recommended: cql.set(cql.text())   // [sdf34u93fjk34j/appe.min.js]
    }).partitionKey(['env', 'name', 'version'])
      .clusteringKey('locale'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });

  /**
   * Fetch the files based on the fingerprint
   */
  Build.prototype.fetchFiles = fetchFiles(models);
  return Build;
};
