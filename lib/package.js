'use strict';

var assign = require('object-assign');
var debug = require('diagnostics')('warehouse-models:package');
var difference = require('lodash.difference');
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function package(dynamo)
 * Returns an  dynamo model representing
 * the metadata of a single version of a package
 * being persisted to the connection associated
 * with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing
 * the metadata of a single version of a package
 */
module.exports = function pkg(dynamo) {
  const hashKey = 'name';
  const schema = {
    name: Joi.string(),
    version: Joi.string(),
    description: Joi.string(),
    main: Joi.string(),
    // Git hash
    gitHead: Joi.string(),
    extended: Joi.object().allow(null),
    // Sets
    keywords: dynamo.types.stringSet(),
    bundledDependencies: dynamo.types.stringSet(),
    // Maps
    distTags: Joi.object().allow(null),
    envs: Joi.object().allow(null),
    metadata: Joi.object().allow(null),
    config: Joi.object().allow(null),
    repository: Joi.object().allow(null),
    dependencies: Joi.object().allow(null),
    devDependencies: Joi.object().allow(null),
    peerDependencies: Joi.object().allow(null),
    optionalDependencies: Joi.object().allow(null)
  };

  const model = dynamo.define('Package', {
    hashKey,
    tableName: 'WrhsPackage',
    schema
  });

  var Pkg = new Dynastar({
    model,
    hashKey,
    // Functions to attach to this class
    fromPublish,
    deserialize
  });

  function extractLatest(data) {
    var version = (data.distTags || data['dist-tags'] || {}).latest;
    return (data.versions || {})[version] || {};
  }

  /**
   * Returns the valid JSON for the Pkg
   * schema transformed from the published
   * payload we expect from `npm`.
   *
   * @param {Object} payload the published payload expected from npm
   *
   * @returns {Object} ?
   */
  function fromPublish(payload) {
    var replica = assign({}, extractLatest(payload));
    var schemaFields = Object.keys(schema);
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
      if (replica[key] || replica[key] === false) acc[key] = replica[key];
      delete replica[key];
      return acc;
    }, {});

    return replica;
  }


  // Deserialize some of our custom data structures stored as text until we know
  // the schema will enforce these for us nicely

  function deserialize(result) {
    if (!result) { return; }
    result.config = Object.keys(result.config || {})
      .reduce(function (acc, key) {
        var value = result.config[key];
        acc[key] = value && typeof value === 'string'
          ? tryParse(value)
          : value;

        return acc;
      }, {});

    return result;
  }

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
