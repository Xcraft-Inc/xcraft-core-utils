'use strict';

var crypto = require('crypto');

exports.md5 = function(data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);
  return md5.digest('hex');
};

exports.genToken = function() {
  var createKey = function(key) {
    var shasum = crypto.createHash('sha1');
    shasum.update(key);
    return shasum.digest('hex');
  };

  var buf = null;

  try {
    buf = crypto.randomBytes(256);
  } catch (ex) {
    /* Handle error.
     * Most likely, entropy sources are drained.
     */
    buf = crypto.pseudoRandomBytes(256);
  }

  return createKey(buf);
};
