'use strict';

var hyperquest = require('hyperquest');
var url = require('url');
var bl = require('bl');
var path = require('path');
var tryParse = require('json-try-parse');
const Joi = require('joi');
const Dynastar = require('dynastar');

/**
 * function version(dynamo)
 * Returns a prototypal dynamo model representing
 * the metadata about a check persisted to the connection
 * associated with the `dynamo` instance provided.
 *
 * @param {dynamo} dynamo Instance of dynamo to attach to.
 *
 * @returns {Object} an dynamo model representing the metadata of
 * the a single version of a single package.
 */
module.exports = function version(dynamo) {
  const hashKey = 'name';
  const rangeKey = 'version';
  const model = dynamo.define('Version', {
    hashKey,
    rangeKey,
    tableName: 'WarehouseVersion',
    schema: {
      name: Joi.string(),
      version: Joi.string(),
      // Text even though its JSON for real because we dont need to parse it when using it
      value: Joi.string()
    }
  });

  return new Dynastar({
    model,
    hashKey,
    rangeKey,
    // Functions to attach to this class
    getAttachment,
    forBuild
  });

  /*
   * Fetch the binary content blob from npm and latch it back onto the package
   * with the appropriate structure.
   *
   * @param {String} read Registry URL.
   * @param {Function} done Completion callback.
   * @api public
   */
  function getAttachment({ pkg, read }, done) {
    const pkgVersion = pkg.version;
    const name = pkg.name;
    const file = name + '-' + pkgVersion + '.tgz';

    read = url.parse(read || '');
    read.pathname = path.posix.join(read.pathname, name, '-', file);

    //
    // Fetch binary data of the package from the configured npm server.
    //
    var uri = url.format(read);
    return hyperquest.get(uri, function got(err, res) {
      if (err || res.statusCode >= 400) {
        return done(err || new Error('HTTP statuscode ' + res.statusCode));
      }

      //
      // Prepare the representation of the attachment.
      //
      pkg._attachments = pkg._attachments || {};
      pkg._attachments[file] = {
        content_type: 'application/octet-stream',
        length: 0,
        data: ''
      };

      //
      // Remark: Collect the buffer and base64 encode it but use the byteLength of the
      // buffer as it will be accurate.
      //
      res.pipe(bl((error, buff) => {
        if (error) return done(error);
        const encoded = buff.toString('base64');
        pkg._attachments[file].data = encoded;
        pkg._attachments[file].length = Buffer.byteLength(encoded);

        done(null, pkg);
      }));
    });
  }

  /*
   * Return the build needed for building in carpenter
   *
   * @param {String} read Registry URL.
   * @param {Function} done Completion callback.
   * @api public
   */
  function forBuild({ pkg, read }, done) {
    getAttachment({ pkg, read }, function gotAttach(err, pack) {
      if (err) return done(err);

      var json = tryParse(pack.value);
      if (!json) {
        return done(new Error(`Bad version record for ${pack.versionId}`));
      }
      json._attachments = pack._attachments;
      done(null, json);
    });
  }
};
