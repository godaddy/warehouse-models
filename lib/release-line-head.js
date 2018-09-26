'use strict';

/**
 * function releaseLineHead(datastar)
 * Returns a prototypal datastar model representing
 * the release line head of a given package
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the release line head
 */
module.exports = function releaseLineHead(datastar) {
  var cql = datastar.schema.cql;
  return datastar.define('release_line_head', {
    schema: datastar.schema.object({
      pkg: cql.text(),
      previous_version: cql.text(),
      version: cql.text()
    }).partitionKey('pkg'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });
};
