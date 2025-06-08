'use strict';

const watt = require('gigawatts');
const crypto = require('crypto');
const fse = require('fs-extra');

/**
 * Compute the checksum of the file given as parameter using a specified algorithm.
 * @param {string} filePath - The file path.
 * @param {object} options - Options.
 * @param {string} options.algorithm - For possible values, see https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options
 * @param {string} options.encoding - (optional) Hash encoding.
 * @returns {string} The file checksum.
 */
exports.fileChecksum = watt(function* (filePath, options, next) {
  if (!options) {
    options = {};
  }
  if (!options.algorithm) {
    options.algorithm = 'sha1';
  }
  if (!options.encoding) {
    options.encoding = 'hex';
  }

  const stat = yield fse.stat(filePath);
  if (!stat.isFile()) {
    throw new Error(`${filePath} is not a file`);
  }

  const hash = crypto.createHash(options.algorithm);
  hash.setEncoding(options.encoding);

  const fileStream = fse.createReadStream(filePath);
  fileStream.pipe(hash, {end: false});
  yield fileStream.once('end', next);

  hash.end();
  return hash.read();
});
