'use strict';

/* eslint max-nested-callbacks: 0 */
var config = require('./config.json');
var Datastar = require('datastar');
var warehouseModels = require('..');
var assume = require('assume');
var async = require('async');
var clone = require('clone');

var BuildFixture = require('./fixtures/build.json');
var BuildFileFixture = require('./fixtures/build-file.json');
var BuildHeadFixture = require('./fixtures/build-head.json');
var DependentFixture = require('./fixtures/dependent.json');
var VersionFixture = require('./fixtures/version.json');
var PackageFixture = require('./fixtures/package.json');

config.consistency = 'quorum';
var datastar = new Datastar(config);
var models = warehouseModels(datastar);

var Build = models.Build;
var BuildFile = models.BuildFile;
var BuildHead = models.BuildHead;
var Dependent  = models.Dependent;
var Version = models.Version;
var Package = models.Package;
var PackageCache = models.PackageCache;

describe('registry-data (integration)', function () {
  function assertAttachment(result) {
    const file = result.name + '-' + result.version + '.tgz';

    assume(result._attachments).to.be.an('object');
    assume(result._attachments).to.have.property(file);
    assume(result._attachments[file].content_type).to.equal('application/octet-stream');
    assume(result._attachments[file].data).to.be.a('string');
    assume(result._attachments[file].length).to.be.above(0);
  }


  before(function (done) {
    if (process.env.DEBUG) {
      datastar.connection.on('queryStarted', function () {
        console.log.apply(console, arguments);
      });
    }
    datastar.connect(done);
  });

  after(function (done) {
    datastar.close(done);
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
        result = BuildFile.deserialize(result);
        assume(err).is.falsey();
        assume(result.buildId).eql(BuildFileFixture.buildId);
        assume(result.env).eql(BuildFileFixture.env);
        assume(result.fingerprint).eql(BuildFileFixture.fingerprint);
        assume(result.name).eql(BuildFileFixture.name);
        assume(result.source).eql(BuildFileFixture.source);
        assume(result.sourcemap).eql(BuildFileFixture.sourcemap);
        assume(result.version).eql(BuildFileFixture.version);
        assume(result.shrinkwrap).eql(BuildFileFixture.shrinkwrap);
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
    var file = clone(BuildFileFixture);
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
      var conditions = clone(BuildFixture);
      delete conditions.locale;
      Build.findAll(conditions, function (err, results) {
        assume(err).is.falsey();
        assume(results).is.an('array');
        assume(results.length).equals(1);
        done();
      });
    });

    it('finds the build model and can fetch the files', function (done) {
      Build.findOne(BuildFixture, function (err, result) {
        assume(err).is.falsey();
        assume(result.buildId).eql(BuildFixture.buildId);
        assume(result.previousBuildId).eql(BuildFixture.previousBuildId);
        assume(result.env).eql(BuildFixture.env);
        assume(result.name).eql(BuildFixture.name);
        assume(result.version).eql(BuildFixture.version);
        assume(result.fingerprints.sort()).eql(BuildFixture.fingerprints.sort());
        assume(result.artifacts.sort()).eql(BuildFixture.artifacts.sort());
        assume(result.recommended).to.be.an('array');

        result.fetchFiles(function (error, files) {
          assume(error).is.falsey();
          assume(files).is.an('array');
          files.forEach(function (file) {
            assume(file).is.an('object');
            assume(file.url).is.a('string');
          });
          done();
        });
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      var ent = clone(BuildFixture);
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
    var file = clone(BuildFileFixture);
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
      BuildHead.findOne({
        name: BuildHeadFixture.name,
        env: BuildHeadFixture.env
      }, function (err, result) {
        assume(err).is.falsey();
        assume(result.buildId).eql(BuildHeadFixture.buildId);
        assume(result.previousBuildId).eql(BuildHeadFixture.previousBuildId);
        assume(result.env).eql(BuildHeadFixture.env);
        assume(result.name).eql(BuildHeadFixture.name);
        assume(result.version).eql(BuildHeadFixture.version);
        assume(result.fingerprints.sort()).eql(BuildHeadFixture.fingerprints.sort());
        assume(result.artifacts.sort()).eql(BuildHeadFixture.artifacts.sort());
        assume(result.recommended).to.be.an('array');

        result.fetchFiles(function (error, files) {
          assume(error).is.falsey();
          assume(files).is.an('array');
          files.forEach(function (file) {
            assume(file).is.an('object');
            assume(file.url).is.a('string');
          });
          done();
        });
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      BuildHead.findOne({
        name: 'email',
        env: 'proddd'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the build_head model', function (done) {
      BuildHead.remove({
        name: BuildHeadFixture.name,
        env: BuildHeadFixture.env
      }, function (err) {
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

    it('deletes the version model', function (done) {
      Dependent.remove({
        name: DependentFixture.name
      }, function (err) {
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
      Version.findOne({
        versionId: VersionFixture.versionId
      }, function (err, result) {
        assume(err).is.falsey();
        assume(result.versionId).eql(VersionFixture.versionId);
        assume(result.value).eql(VersionFixture.value);
        done();
      });
    });

    it('can fetch the binary blob of versioned content', function (done) {
      Version.findOne({
        versionId: VersionFixture.versionId
      }, function (err, result) {
        assume(err).is.falsey();

        //
        // Mock data, that is available on the public registry.
        //
        result.name = 'minimize';
        result.version = '1.7.0';
        result.getAttachment('http://registry.npmjs.org/', function (error, result) {
          assume(error).is.falsey();
          assertAttachment(result);
          done();
        });
      });
    });

    it('returns a falsey value for an unknown id', function (done) {
      Version.findOne({
        versionId: VersionFixture.versionId + '1'
      }, function (err, result) {
        if (err) return done(err);
        assume(result).is.falsey();
        done();
      });
    });

    it('deletes the version model', function (done) {
      Version.remove({
        versionId: VersionFixture.versionId
      }, function (err) {
        assume(err).is.falsey();
        done();
      });
    });
  });

  describe('package', function () {

    after(function (done) {
      async.parallel([
        Package.dropTables.bind(Package),
        PackageCache.dropTables.bind(PackageCache)
      ], done);
    });

    it('ensures there is a package and package_cache table', function (done) {
      async.parallel([
        Package.ensureTables.bind(Package),
        PackageCache.ensureTables.bind(PackageCache)
      ], done);
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
        assume(err).is.falsey();
        assertPackage(result);
        done();
      });
    });

    //
    // So findOne doesnt work here, not sure why?? getting an error from the
    // driver about it expecting a UUID? Can clustering key not be `text`?
    // Doesnt really matter for our use case though
    //
    it('returns the same package from PackageCache', function (done) {
      PackageCache.findAll({
        conditions: {
          partitioner: 'cached'
        }
      }, function (err, results) {
        assume(err).is.falsey();
        assertPackage(results[0]);
        done();
      });
    });

    it('returns an a falsey value for an unknown id', function (done) {
      Package.findOne({
        name: 'what'
      }, function (err, result) {
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
