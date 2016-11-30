'use strict';

var assume = require('assume');
var clone = require('clone');
var models = require('..');
var mocks = require('datastar-test-tools').mocks;
var helpers = require('datastar-test-tools').helpers;
var fixtures = require('./fixtures');

var packageStrip = fixtures.packageStrip;
var buildFileFix = fixtures.buildFile;

describe('warehouse-models (unit)', function () {
  var dal;
  beforeEach(function () {
    var datastar = helpers.connectDatastar({ mock: true }, mocks.datastar());
    dal = models(datastar);
  });

  it('should return the appropriate object', function () {
    assume(dal.Build).is.a('function');
    assume(dal.BuildFile).is.a('function');
    assume(dal.BuildHead).is.a('function');
    assume(dal.Package).is.a('function');
    assume(dal.PackageCache).is.a('function');
    assume(dal.Version).is.a('function');
    assume(dal.Dependent).is.a('function');
  });

  it('should have an `ensure` function', function () {
    assume(dal.ensure).is.a('function');
  });

  it('should contain a deserialize function on the BuildFile model that turns Buffers -> strings', function () {
    assume(dal.BuildFile.deserialize).is.a('function');
    var first = dal.BuildFile.deserialize(buildFileFix.array);
    assume(first).is.an('array');
    assume(first[0].source).is.a('string');
    var second = dal.BuildFile.deserialize(buildFileFix.object);
    assume(second).is.an('object');
    assume(second.source).is.a('string');
    assume(second.sourcemap).is.a('string');
  });

  it('should return a dal whos Build and BuildHead prototype has a fetchFiles function', function () {
    assume(dal.Build.prototype.fetchFiles).is.a('function');
    assume(dal.BuildHead.prototype.fetchFiles).is.a('function');
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

});
