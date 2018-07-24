'use strict';

/**
 * function releaseLine(datastar)
 * Returns a prototypal datastar model representing
 * the release line of a given package and version
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the release line
 */
module.exports = function releaseLine(datastar) {
  var cql = datastar.schema.cql;
  return datastar.define('release_line', {
    schema: datastar.schema.object({
      pkg: cql.text(),
      previous_version: cql.text(),
      version: cql.text()
    }).partitionKey(['pkg', 'version']),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });
};
