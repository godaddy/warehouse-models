'use strict';

var assume = require('assume');
var clone = require('clone');
var models = require('..');
var dynamo = require('dynamodb');
var Dynastar = require('dynastar');
var fixtures = require('./fixtures');

var packageStrip = fixtures.packageStrip;

describe('warehouse-models (unit)', function () {
  var dal;
  beforeEach(function () {
    dal = models(dynamo);
  });

  it('should return the appropriate object', function () {
    assume(dal.Build).is.a(Dynastar);
    assume(dal.BuildFile).is.a(Dynastar);
    assume(dal.BuildHead).is.a(Dynastar);
    assume(dal.Package).is.a(Dynastar);
    assume(dal.PackageCache).is.a(Dynastar);
    assume(dal.Version).is.a(Dynastar);
    assume(dal.Dependent).is.a(Dynastar);
  });

  it('should have an `ensure` function', function () {
    assume(dal.ensure).is.a('function');
  });

  it('should have an `drop` function', function () {
    assume(dal.drop).is.a('function');
  });

  it('should contain a defined function on the Package model that should strip values', function () {
    var secondFixture = clone(packageStrip);
    assume(dal.Package.fromPublish).is.a('function');
    assume(dal.Package.deserialize).is.a('function');
    assume(dal.Package.fromPublish(packageStrip.before)).to.eql(packageStrip.after);
    assume(dal.Package.deserialize(secondFixture.after)).to.eql(
      dal.Package.deserialize(dal.Package.fromPublish(secondFixture.before))
    );
    assume(packageStrip.before.versions['1.0.0'].config).deep.equals({ locales: ['en-US'] });
  });

  it('should have a method to fetch the binary blob of versioned content', function () {
    assume(dal.Version.prototype.getAttachment).is.a('function');
    assume(dal.Version.prototype.getAttachment.length).to.equal(2);
  });

  it('should have a method to fetch and create a build payload from versioned content', function () {
    assume(dal.Version.prototype.forBuild).is.a('function');
    assume(dal.Version.prototype.forBuild.length).to.equal(2);
  });

});
