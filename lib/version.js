'use strict';

var hyperquest = require('hyperquest');
var url = require('url');
var bl = require('bl');
var path = require('path');

/**
 * function version(datastar)
 * Returns a prototypal datastar model representing
 * the metadata about a check persisted to the connection
 * associated with the `datastar` instance provided.
 *
 * @param {datastar} datastar Instance of datastar to attach to.
 *
 * @returns {Object} an datastar model representing the metadata of
 * the a single version of a single package.
 */
module.exports = function version(datastar) {
  var cql = datastar.schema.cql;
  var Version = datastar.define('version', {
    schema: datastar.schema.object({
      version_id: cql.text(),
      name: cql.text(),
      version: cql.text(),
      // Text even though its JSON for real because we dont need to parse it when using it
      value: cql.text()
    }).partitionKey('version_id'),
    with: {
      compaction: {
        'class': 'LeveledCompactionStrategy'
      }
    }
  });

  /*
   * Fetch the binary content blob from npm and latch it back onto the package
   * with the appropriate structure.
   *
   * @param {String} read Registry URL.
   * @param {Function} done Completion callback.
   * @api public
   */
  Version.prototype.getAttachment = function getAttachment(read, done) {
    var pkg = this;
    var version = pkg.version;
    var name = pkg.name;
    var file = name + '-' + version + '.tgz';

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
        'content_type': 'application/octet-stream',
        'length': 0,
        'data': ''
      };

      //
      // Remark: Collect the buffer and base64 encode it but use the byteLength of the
      // buffer as it will be accurate.
      //
      res.pipe(bl((err, buff) => {
        if (err) return done(err);
        const encoded = buff.toString('base64');
        pkg._attachments[file].data = encoded;
        pkg._attachments[file].length = Buffer.byteLength(encoded);

        done(null, pkg);
      }));
    });
  };

  return Version;
}
