'use strict';

var assign = require('object-assign');
var debug = require('diagnostics')('warehouse-models:package');
var difference = require('lodash.difference');

/**
 * function package(datastar, models)
 * Returns an  datastar model representing
 * the metadata of a single version of a package
 * being persisted to the connection associated
 * with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 * @param {Object} models Set of registry-data models.
 *
 * @returns {Object} an datastar model representing
 * the metadata of a single version of a package
 */
module.exports = function pkg(datastar, models) {
  var cql = datastar.schema.cql;
  var Pkg = datastar.define('package', {
    schema: datastar.schema.object({
      name: cql.text(),
      version: cql.text(),
      description: cql.text(),
      main: cql.text(),
      // Git hash
      git_head: cql.text(),
      // text for backwards compat but support this as JSON in the future
      extended: cql.json(),
      // Sets
      keywords: cql.set(cql.text()),
      bundled_dependencies: cql.set(cql.text()),
      // Maps
      dist_tags: cql.map(
        cql.text(), cql.text().allow(null)
      ).allow(null),
      envs: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      metadata: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      // TODO: Does joi.alternatives().try(cql.json(), cql.text()) for a map
      // value with how we detect the meta in datastar?
      config: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      repository: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      dependencies: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      dev_dependencies: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      peer_dependencies: cql.map(
        cql.text(), cql.text()
      ).allow(null),
      optional_dependencies: cql.map(
        cql.text(), cql.text()
      ).allow(null)
    }).partitionKey('name'),
    with: {
      compaction: {
        class: 'LeveledCompactionStrategy'
      }
    }
  });

  //
  // Do i really need a deep clone here?
  //
  function cacheModifier(pkg) {
    return assign({ partitioner: 'cached' }, pkg);
  }
  //
  // Store everything we get through packages being created and mimick those
  // operations on the PackageCache
  //
  ['create', 'update', 'remove'].forEach(function (action) {
    Pkg.before([action, 'build'].join(':'), function (options, next) {
      //
      // We use the PackageCache functions to build a set of statements that
      // will get executed alongside the Package ones to ensure consistency.
      // TODO: Do i need to deep clone this to not overwrite object references
      // that will be used in the Package's build?
      //
      var opts = assign({}, options, {
        entities: options.entities.map(cacheModifier),
        previous: options.previous.map(cacheModifier),
        shouldExecute: false
      });

      //
      // Build our statements for inserting into the package cache. The reason
      // this works is that we use the `options.statements` that is being used
      // for the `Package` model that was created already and appending our
      // statements to it first before the `Package` model gets to add its own
      // from the same underlying data
      //
      models.PackageCache[action](opts, function (err, statements) {
        if (err) { return next(err); }
        //
        // Save these statements for when the Package statements get executed so
        // we can merge together. This should ensure the proper object reference
        // is set
        //
        options.statements = statements;
        options.statements.strategy = 'batch';
        next();
      });
    });
  });

  Pkg.extractLatest = function (data) {
    var version = (data.distTags || data['dist-tags'] || {}).latest;

    return (data.versions || {})[version] || {};
  };
  /**
   * Returns the valid JSON for the Pkg
   * schema transformed from the published
   * payload we expect from `npm`.
   *
   * @param {Object} payload the published payload expected from npm
   *
   * @returns {Object} ?
   */
  Pkg.fromPublish = function (payload) {
    var replica = assign({}, this.extractLatest(payload));
    var schemaFields = Pkg.schema.mappedFields();
    var keys;

    //
    // Strip other restricted keys: _id, _shasum, etc.
    //
    Object.keys(replica).forEach(function (key) {
      if (key[0] === '_'
        || key === 'readme'
        || key === 'dist'
        || key === 'readmeFilename') {
        delete replica[key];
      }
    });

    //
    // Stringify keys as necessary in `config` in a deep clone
    //
    if (replica.config) {
      replica.config = Object.keys(replica.config)
        .reduce(function (acc, key) {
          var value = replica.config[key];
          acc[key] = value && typeof value !== 'string'
            ? JSON.stringify(value)
            : value;

          return acc;
        }, {});
    }

    //
    // Add the top-level keys we know about and know
    // are not also on the version "sub-package".
    //
    replica.maintainers = payload.maintainers;
    replica.distTags = payload['dist-tags'];
    keys = Object.keys(replica);

    //
    // Use the keys not included in the schema to be attached to this extended
    // object
    //
    replica.extended = difference(keys, schemaFields).reduce(function (acc, key) {
      acc[key] = replica[key];
      delete replica[key];
      return acc;
    }, {});

    return replica;
  };

  //
  // Deserialize some of our custom data structures stored as text until we know
  // the schema will enforce these for us nicely
  //
  Pkg.deserialize = function deserialize(results) {
    var array = true;
    if (!results) { return; }
    if (!Array.isArray(results)) {
      results = [results];
      array = false;
    }

    var ret = results.map(function (result) {
      result.config = Object.keys(result.config || {})
        .reduce(function (acc, key) {
          var value = result.config[key];
          acc[key] = value && typeof value === 'string'
            ? tryParse(value)
            : value;

          return acc;
        }, {});

      return result;
    });

    return array ? ret : ret[0];
  };

  //
  // All will only work for non streaming, otherwise this will never get called
  //
  ['one', 'all'].forEach(function (type) {
    Pkg.after(['find', type].join(':'), function (result, callback) {
      callback(null, Pkg.deserialize(result));
    });
  });

  return Pkg;
};

//
// Try to parse a string as JSON, otherwise return the string
//
function tryParse(data) {
  var json;
  try {
    json = JSON.parse(data);
  } catch (ex) { debug('tryParse exception %s for data %s', ex, data); }

  return json || data;
}
