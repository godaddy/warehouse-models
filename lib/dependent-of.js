'use strict';

/**
 * function dependentOf(datastar)
 * Returns a prototypal datastar model representing
 * the package that a given package is a dependent of
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the metadata of
 * the dependents of a single module.
 *
 */
module.exports = function dependentOf(datastar) {
  var cql = datastar.schema.cql;
  return datastar.define('dependent_of', {
    schema: datastar.schema.object({
      pkg: cql.text(),
      dependent_of: cql.text()
    }).partitionKey('pkg'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });
};
