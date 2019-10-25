'use strict';

var after = require('after');

/**
 * function wrhs(dynamodb)
 * Export all known models, given a `dynamodb` instance
 *
 * @param {dynamodb} dynamodb instance of a dynamodb object
 *
 * @returns {WarehouseModels} instance of warehouse-models
 */
module.exports = function wrhs(dynamodb) {
  return new WarehouseModels(dynamodb);
};

/**
 * Make a predictable constructor based object and pass in the context with dynamodb
 * because we are adding all of the models to this parent `WarehouseModels` constructor
 * and they should have access to each other if needed
 *
 * @param {Dynamodb} dynamodb Instance of Dynamodb
 */
function WarehouseModels(dynamodb) {
  this.Build = require('./build')(dynamodb, this);
  this.BuildFile = require('./build-file')(dynamodb, this);
  this.BuildHead = require('./build-head')(dynamodb, this);
  this.Package = require('./package')(dynamodb, this);
  this.PackageCache = require('./package-cache')(dynamodb, this);
  this.Version = require('./version')(dynamodb, this);
  this.Dependent = require('./dependent')(dynamodb, this);
  this.DependentOf = require('./dependent-of')(dynamodb, this);
  this.ReleaseLine = require('./release-line')(dynamodb, this);
  this.ReleaseLineHead = require('./release-line-head')(dynamodb, this);
  this.ReleaseLineDep = require('./release-line-dep')(dynamodb, this);
}

/**
 * A function that ensures all tables exist for the configured dynamodb
 * instance
 *
 * @param {Function} callback Continuation function
 */
WarehouseModels.prototype.ensure = function (callback) {
  var keys = Object.keys(this);
  var next = after(keys.length, callback);
  keys.forEach(function (key) {
    this[key].ensureTables(next);
  }, this);
};

/**
 * A function that drops all tables defined for the configured dynamodb
 * instance
 *
 * @param {Function} callback Continuation function
 */
WarehouseModels.prototype.drop = function (callback) {
  var keys = Object.keys(this);
  var next = after(keys.length, callback);
  keys.forEach(function (key) {
    this[key].dropTables(next);
  }, this);
};
