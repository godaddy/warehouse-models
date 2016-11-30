'use strict';

var after = require('after');

/**
 * function wrhs(datastar)
 * Export all known models, given a `datastar` instance
 *
 * @param {datastar} datastar instance of a datastar object
 *
 * @returns {WarehouseModels} instance of warehouse-modelsa
 */
module.exports = function wrhs(datastar) {
  return new WarehouseModels(datastar);
};

/**
 * Make a predictable constructor based object and pass in the context with datastar
 * because we are adding all of the models to this parent `WarehouseModels` constructor
 * and they should have access to each other if needed
 *
 * @param {Datastar} datastar Instance of Datastar
 */
function WarehouseModels(datastar) {
  this.Build = require('./build')(datastar, this);
  this.BuildFile = require('./build-file')(datastar, this);
  this.BuildHead = require('./build-head')(datastar, this);
  this.Package = require('./package')(datastar, this);
  this.PackageCache = require('./package-cache')(datastar, this);
  this.Version = require('./version')(datastar, this);
  this.Dependent = require('./dependent')(datastar, this);
}

/**
 * A function that ensures all tables exist for the configured datastar
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
