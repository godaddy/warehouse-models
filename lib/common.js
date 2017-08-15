'use strict';

/* eslint no-invalid-this: 0 */

var path = require('path');
var after = require('after');

//
// Used for build and build-head
//
exports.fetchFiles = function fetchFactory(models) {
  return function fetchFiles(fn) {
    var files = [];
    //
    // Use the .gz because it will be inherently smaller
    //
    var prints = this.fingerprints.filter(function (print) {
      return path.extname(print) === '.gz';
    });

    //
    // Cleanup the heavyweight stuff and meta data
    //
    var strip = function strip(file) {
      file.fingerprint = file.fingerprint.slice(0, -3);
      delete file.source;
      delete file.sourcemap;
      delete file.shrinkwrap;
      return file;
    };

    var done = after(prints.length, function done(err) {
      if (err) { return fn(err); }
      //
      // Remove the heavy weight pieces and return the build with replaced
      // fingerprints. In the future we might want to rename to `files`
      //
      fn(null, files.map(strip));
    });

    var next = function (err, file) {
      if (err) { return done(err); }
      files.push(file.toJSON());
      done();
    };

    prints.forEach(function (print) {
      models.BuildFile.get(print, next);
    });
  };
};
