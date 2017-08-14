'use strict';

/**
 * function dependent(datastar)
 * Returns a prototypal datastar model representing
 * a built package being persisted to the connection
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the metadata of
 * the dependents of a single module.
 *
 */
module.exports = function dependent(datastar) {
  var cql = datastar.schema.cql;
  return datastar.define('dependent', {
    schema: datastar.schema.object({
      name: cql.text(),
      dependents: cql.set(cql.text())
    }).partitionKey('name'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });
};
