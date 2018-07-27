'use strict';

/**
 * function releaseLineDep(datastar)
 * Returns a prototypal datastar model representing
 * the dependents of a package for a specific release
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the release line
 */
module.exports = function releaseLineDep(datastar) {
  var cql = datastar.schema.cql;
  return datastar.define('release_line_dep', {
    schema: datastar.schema.object({
      pkg: cql.text(),
      previous_version: cql.text(),
      version: cql.text(),
      dependent: cql.text(),
      dependent_version: cql.text()
    }).partitionKey(['pkg', 'version'])
      .clusteringKey('dependent'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });
};
