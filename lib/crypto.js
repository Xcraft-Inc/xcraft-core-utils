'use strict';

var crypto = require('crypto');
const uuidV4 = require('uuid/v4');

exports.md5 = function(data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);
  return md5.digest('hex');
};

exports.sha256 = function(data) {
  var sha = crypto.createHash('sha256');
  sha.update(data);
  return sha.digest('hex');
};

exports.genToken = function() {
  return uuidV4().replace(/-/g, '');
};
