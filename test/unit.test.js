'use strict';

var assume = require('assume');
var models = require('..');
var dynamo = require('dynamodb');
var Dynastar = require('dynastar');

describe('warehouse-models (unit)', function () {
  var dal;
  beforeEach(function () {
    dal = models(dynamo);
  });

  it('should return the appropriate object', function () {
    assume(dal.Build).is.instanceof(Dynastar);
    assume(dal.BuildFile).is.instanceof(Dynastar);
    assume(dal.BuildHead).is.instanceof(Dynastar);
    assume(dal.Package).is.instanceof(Dynastar);
    assume(dal.Version).is.instanceof(Dynastar);
    assume(dal.Dependent).is.instanceof(Dynastar);
  });

  it('should have an `ensure` function', function () {
    assume(dal.ensure).is.a('function');
  });

  it('should have an `drop` function', function () {
    assume(dal.drop).is.a('function');
  });
});
