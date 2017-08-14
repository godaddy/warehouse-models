'use strict';

var fetchFiles = require('./common').fetchFiles;

/**
 * function buildHead(datastar)
 * Returns a prototypal datastar model representing
 * HEAD of a built package being persisted to the connection
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an datastar model representing the metadata of
 * the latest build (i.e. HEAD) of a [env, package] pair
 */
module.exports = function buildHead(datastar, models) {
  var cql = datastar.schema.cql;

  var BuildHead = datastar.define('build_head', {
    schema: datastar.schema.object({
      env: cql.text(),
      name: cql.text(),
      build_id: cql.text(),
      previous_build_id: cql.text(),
      rollback_build_ids: cql.map(cql.text(), cql.text()), // timestamp is stored as string
      create_date: cql.timestamp({ default: 'create' }),
      udpate_date: cql.timestamp({ default: 'update' }),
      version: cql.text(),
      locale: cql.text(),
      cdn_url: cql.text(), // URL of CDN to be used as a base for all the artifacts
      fingerprints: cql.set(cql.text()),
      artifacts: cql.set(cql.text()),
      recommended: cql.set(cql.text())
    }).partitionKey(['env', 'name'])
      .clusteringKey('locale'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });

  //
  // Create the assigned function on the prototype to fetchFiles based on the
  // state of the instance
  //
  BuildHead.prototype.fetchFiles = fetchFiles(models);

  return BuildHead;
};
