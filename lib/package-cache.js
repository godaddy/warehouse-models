'use strict';

/**
 * function cache(datastar, models)
 * Returns an  datastar model representing
 * the metadata of a single version of a package.
 * The reason this exists as a cache is so we can efficiently range
 * query this set for caching reasons. It is not good in cassandra to do a range
 * query that spans multiple partitions.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an datastar model representing
 * the metadata of a single version of a package
 */
module.exports = function cache(datastar, models) {
  var cql = datastar.schema.cql;
  return datastar.define('package_cache', {
    //
    // Inherit from package and just add a different partitionKey and use
    // a clusteringKey
    //
    schema: models.Package.schema.joi.concat(
      datastar.schema.object({
        partitioner: cql.text()
      })
    ).partitionKey('partitioner')
      .clusteringKey('name'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });
};
