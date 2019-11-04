'use strict';

/* eslint max-nested-callbacks: 0 */
var { DynamoDB } = require('aws-sdk');
var dynamo = require('dynamodb');
var AwsLiveness = require('aws-liveness');
const warehouseModels = require('..');
const assume = require('assume');
const async = require('async');
const clone = require('clone');

const region = 'us-east-1';
const endpoint = 'http://localhost:4569';
// Need to set some values for these for it to actually work
process.env.AWS_ACCESS_KEY_ID = 'foobar';
process.env.AWS_SECRET_ACCESS_KEY = 'foobar';

const dynamoDriver = new DynamoDB({ endpoint, region });
dynamo.dynamoDriver(dynamoDriver);
const liveness = new AwsLiveness();

const BuildFixture = require('./fixtures/build.json');
const BuildFileFixture = require('./fixtures/build-file.json');
const BuildHeadFixture = require('./fixtures/build-head.json');
const DependentFixture = require('./fixtures/dependent.json');
const DependentOfFixture = require('./fixtures/dependent-of.json');
const ReleaseLineFixture = require('./fixtures/release-line.json');
const ReleaseLineDepFixture = require('./fixtures/release-line-dep.json');
const VersionFixture = require('./fixtures/version.json');
const PackageFixture = require('./fixtures/package.json');

const models = warehouseModels(dynamo);
const { Build, BuildFile, BuildHead, Dependent, DependentOf, ReleaseLine, ReleaseLineHead, ReleaseLineDep, Version, Package } = models;

describe('registry-data (integration)', function () {
  function assertAttachment(result) {
    const file = `${result.name}-${result.version}.tgz`;

    assume(result._attachments).to.be.an('object');
    assume(result._attachments).to.have.property(file);
    assume(result._attachments[file].content_type).to.equal('application/octet-stream');
    assume(result._attachments[file].data).to.be.a('string');
    assume(result._attachments[file].length).to.be.above(0);
  }


  before(function (done) {
    liveness.waitForServices({
      clients: [dynamoDriver],
      waitSeconds: 60
    }).then(() => done())
      .catch(done);
  });

  describe('models', function () {
    this.timeout(3E5);
    it('ensures all tables exist', function (done) {
      models.ensure(err => {
        assume(err).is.falsey();
        done();
      });
    });

    it('drops existing tables', function (done) {
      models.drop(err => {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('buildFile', function () {

    after(function (done) {
      BuildFile.dropTables(done);
    });

    it('ensures there is a build_file table', function (done) {
      BuildFile.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a build_file model', function (done) {
      BuildFile.create(BuildFileFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the build_file model', function (done) {
      BuildFile.findOne({
        fingerprint: BuildFileFixture.fingerprint
      }, function (err, result) {
        assume(err).is.falsey();
        assume(result.buildId).eql(BuildFileFixture.buildId);
        assume(result.env).eql(BuildFileFixture.env);
        assume(result.fingerprint).eql(BuildFileFixture.fingerprint);
        assume(result.name).eql(BuildFileFixture.name);
        assume(result.version).eql(BuildFileFixture.version);
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      BuildFile.findOne({
        fingerprint: '3'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the build model', function (done) {
      BuildFile.remove({
        fingerprint: BuildFileFixture.fingerprint
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('build', function () {
    const file = clone(BuildFileFixture);
    file.fingerprint = 'a.gz';

    before(function (done) {
      BuildFile.ensureTables(err => {
        if (err) return done(err);

        // this can be racey in some cases???
        setTimeout(() => {
          BuildFile.create(file, done);
        }, 3000);
      });
    });

    after(function (done) {
      async.series([
        BuildFile.remove.bind(BuildFile, file),
        BuildFile.dropTables.bind(BuildFile),
        Build.dropTables.bind(Build)
      ], done);
    });

    it('ensures there is a build table', (done) => {
      Build.ensureTables((err) => {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a build model', function (done) {
      Build.create(BuildFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('should find all builds with a findAll', function (done) {
      const conditions = clone(BuildFixture);
      delete conditions.locale;
      Build.findAll(conditions, function (err, results) {
        assume(err).is.falsey();
        assume(results).is.an('array');
        assume(results.length).equals(1);
        done();
      });
    });

    it('finds the build model', function (done) {
      Build.findOne(BuildFixture, function (err, result) {
        assume(err).is.falsey();
        assume(result.buildId).eql(BuildFixture.buildId);
        assume(result.previousBuildId).eql(BuildFixture.previousBuildId);
        assume(result.env).eql(BuildFixture.env);
        assume(result.name).eql(BuildFixture.name);
        assume(result.version).eql(BuildFixture.version);
        assume(result.fingerprints.sort()).eql(BuildFixture.fingerprints.sort());
        assume(result.artifacts.sort()).eql(BuildFixture.artifacts.sort());
        assume(result.recommended.sort()).eql(BuildFixture.recommended.sort());
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      const ent = clone(BuildFixture);
      ent.version = '0.9.9';
      Build.findOne(ent, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the build model', function (done) {
      Build.remove(BuildFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

  });


  describe('buildHead', function () {
    const file = clone(BuildFileFixture);
    file.fingerprint = 'b.gz';

    before(function (done) {
      BuildFile.ensureTables(err => {
        if (err) return done(err);

        BuildFile.create(file, done);
      });
    });

    after(function (done) {
      async.series([
        BuildFile.remove.bind(BuildFile, file),
        BuildFile.dropTables.bind(BuildFile),
        BuildHead.dropTables.bind(BuildHead)
      ], done);
    });

    it('ensures there is a build_head table', function (done) {
      BuildHead.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a build_head model', function (done) {
      BuildHead.create(BuildHeadFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the build_head model', function (done) {
      BuildHead.findOne(BuildHeadFixture, function (err, result) {
        assume(err).is.falsey();
        assume(result.buildId).eql(BuildHeadFixture.buildId);
        assume(result.previousBuildId).eql(BuildHeadFixture.previousBuildId);
        assume(result.env).eql(BuildHeadFixture.env);
        assume(result.name).eql(BuildHeadFixture.name);
        assume(result.version).eql(BuildHeadFixture.version);
        assume(result.fingerprints.sort()).eql(BuildHeadFixture.fingerprints.sort());
        assume(result.artifacts.sort()).eql(BuildHeadFixture.artifacts.sort());
        assume(result.recommended).to.be.an('array');
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      BuildHead.findOne({
        name: 'email',
        env: 'proddd',
        locale: 'en-US'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the build_head model', function (done) {
      BuildHead.remove(BuildHeadFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

  });

  describe('dependent', function () {

    after(function (done) {
      Dependent.dropTables(done);
    });

    it('ensures there is a dependent table', function (done) {
      Dependent.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a dependent model', function (done) {
      Dependent.create(DependentFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the dependent model', function (done) {
      Dependent.findOne({
        name: DependentFixture.name
      }, function (err, result) {
        assume(err).is.falsey();
        assume(result.name).eql(DependentFixture.name);
        assume(result.dependents.sort()).eql(DependentFixture.dependents.sort());
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      Dependent.findOne({
        name: DependentFixture.name + 'bah'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the dependent model', function (done) {
      Dependent.remove({
        name: DependentFixture.name
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

  });

  describe('dependent-of', function () {

    after(function (done) {
      DependentOf.dropTables(done);
    });

    it('ensures there is a dependent_of table', function (done) {
      DependentOf.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a dependent_of model', function (done) {
      DependentOf.create(DependentOfFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the dependent_of model', function (done) {
      DependentOf.findOne({
        pkg: DependentOfFixture.pkg
      }, function (err, result) {

        assume(err).is.falsey();
        assume(result.pkg).eql(DependentOfFixture.pkg);
        assume(result.dependentOf).eql(DependentOfFixture.dependentOf);
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      DependentOf.findOne({
        pkg: DependentOfFixture.pkg + 'bah'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the dependent_of model', function (done) {
      DependentOf.remove({
        pkg: DependentOfFixture.pkg
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('release-line', function () {

    after(function (done) {
      ReleaseLine.dropTables(done);
    });

    it('ensures there is a release_line table', function (done) {
      ReleaseLine.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a release line model', function (done) {
      ReleaseLine.create(ReleaseLineFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the release line model', function (done) {
      ReleaseLine.findOne({
        pkg: ReleaseLineFixture.pkg,
        version: ReleaseLineFixture.version
      }, function (err, result) {

        assume(err).is.falsey();
        assume(result.pkg).eql(ReleaseLineFixture.pkg);
        assume(result.previousVersion).eql(ReleaseLineFixture.previousVersion);
        assume(result.version).eql(ReleaseLineFixture.version);
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      ReleaseLine.findOne({
        pkg: ReleaseLineFixture.pkg + 'bah',
        version: ReleaseLineFixture.version
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the release line model', function (done) {
      ReleaseLine.remove({
        pkg: ReleaseLineFixture.pkg,
        version: ReleaseLineFixture.version
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('release-line-head', function () {

    after(function (done) {
      ReleaseLineHead.dropTables(done);
    });

    it('ensures there is a release_line table', function (done) {
      ReleaseLineHead.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a release line model', function (done) {
      ReleaseLineHead.create(ReleaseLineFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the release line model', function (done) {
      ReleaseLineHead.findOne({
        pkg: ReleaseLineFixture.pkg
      }, function (err, result) {

        assume(err).is.falsey();
        assume(result.pkg).eql(ReleaseLineFixture.pkg);
        assume(result.previousVersion).eql(ReleaseLineFixture.previousVersion);
        assume(result.version).eql(ReleaseLineFixture.version);
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      ReleaseLineHead.findOne({
        pkg: ReleaseLineFixture.pkg + 'bah'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the release line model', function (done) {
      ReleaseLineHead.remove({
        pkg: ReleaseLineFixture.pkg
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('release-line-dep', function () {

    after(function (done) {
      ReleaseLineDep.dropTables(done);
    });

    it('ensures there is a dependent_of table', function (done) {
      ReleaseLineDep.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a dependent_of model', function (done) {
      ReleaseLineDep.create(ReleaseLineDepFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the dependent_of model', function (done) {
      ReleaseLineDep.findOne(ReleaseLineDepFixture, function (err, result) {
        assume(err).is.falsey();
        assume(result.pkg).eql(ReleaseLineDepFixture.pkg);
        assume(result.previousVersion).eql(ReleaseLineDepFixture.previousVersion);
        assume(result.version).eql(ReleaseLineDepFixture.version);
        assume(result.dependent).eql(ReleaseLineDepFixture.dependent);
        assume(result.dependentVersion).eql(ReleaseLineDepFixture.dependentVersion);
        done();
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      const BadReleaseLineDepFixture = { ... ReleaseLineDepFixture, pkg: ReleaseLineDepFixture.pkg + 'bah' };
      ReleaseLineDep.findOne(BadReleaseLineDepFixture, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the dependent_of model', function (done) {
      ReleaseLineDep.remove(ReleaseLineDepFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('version', function () {

    after(function (done) {
      Version.dropTables(done);
    });

    it('ensures there is a version table', function (done) {
      Version.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a version model', function (done) {
      Version.create(VersionFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('finds the version model', function (done) {
      Version.findOne(VersionFixture, function (err, result) {
        assume(err).is.falsey();
        assume(result.name).eql(VersionFixture.name);
        assume(result.value).eql(VersionFixture.value);
        done();
      });
    });

    it('can fetch the binary blob of versioned content', function (done) {
      Version.findOne(VersionFixture, function (err, result) {
        assume(err).is.falsey();

        //
        // Mock data, that is available on the public registry.
        //
        result.name = 'minimize';
        result.version = '1.7.0';
        Version.getAttachment({ pkg: result, read: 'http://registry.npmjs.org/' }, function (error, result) {
          assume(error).is.falsey();
          assertAttachment(result);
          done();
        });
      });
    });

    it('returns a falsey value for an non-existent name', function (done) {
      Version.findOne({
        name: 'fakename',
        version: '1.5'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the version model', function (done) {
      Version.remove(VersionFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('package', function () {

    after(function (done) {
      Package.dropTables(done);
    });


    it('ensures there is a package', function (done) {
      Package.ensureTables(function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    it('creates a package model', function (done) {
      Package.create(PackageFixture, function (err) {
        assume(err).is.falsey();
        done();
      });
    });

    function assertPackage(result) {
      assume(result.name).eql(PackageFixture.name);
      assume(result.version).eql(PackageFixture.version);
      assume(result.main).eql(PackageFixture.main);
      assume(result.distTags).eql(PackageFixture.distTags);
      assume(result.config).eql(PackageFixture.config);
    }

    it('finds a package model', function (done) {
      Package.findOne({
        name: PackageFixture.name
      }, function (err, result) {
        result = Package.deserialize(result);
        assume(err).is.falsey();
        assertPackage(result);
        done();
      });
    });

    it('returns an a falsey value for an unknown id', function (done) {
      Package.findOne({
        name: 'what'
      }, function (err, result) {
        result = Package.deserialize(result);
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the package model', function (done) {
      Package.remove({
        name: PackageFixture.name
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

});
