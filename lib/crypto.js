'use strict';

var crypto = require('crypto');
const uuidV4 = require('uuid/v4');
const watt = require('gigawatts');
const fs = require('fs');

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

// Get the number of random bytes needed and the mask
// used to generate an integer in the specified range
function getBytesSizeAndMask(range) {
  let mask = 0;
  let bitsCount = 0;
  while (range > 0) {
    mask = (mask << 1) | 1; // 0x00000011 -> 0x00000111
    range = range >>> 1; // 0x00111100 -> 0x00011110
    bitsCount++;
  }
  const bytesSize = (bitsCount + 7) >> 3; // ceil(bitsCount / 8)
  return {bytesSize, mask};
}

/**
 * Generate a random integer between min and max.
 *
 * @param {number} min - Min value.
 * @param {number} max - Max value.
 * @returns {number} A random integer between min and max
 */
function randomInt(min, max) {
  const range = max - min;
  if (range > 2147483647 || range < 0) {
    // max safe integer for bitwise operations (2147483647 = 2^31 - 1)
    throw new Error('Range must be between 0 and 2147483647');
  }

  const {bytesSize, mask} = getBytesSizeAndMask(range);
  let randomInt;
  do {
    const randomBytes = crypto.randomBytes(bytesSize);

    // Convert random bytes to an integer
    randomInt = 0;
    for (let i = 0; i < bytesSize; i++) {
      randomInt = (randomInt << 8) | randomBytes[i];
    }

    // Apply mask to reduce the number of discarded numbers
    randomInt = randomInt & mask;
  } while (randomInt > range); // Discard random numbers outside the range

  return min + randomInt;
}
exports.randomInt = randomInt;

const defaultChars =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ@+-=*&%?!_23456789';

function randomChar(chars = defaultChars) {
  const charId = randomInt(0, chars.length - 1);
  return chars[charId];
}
exports.randomChar = randomChar;

/**
 * Generate a random password.
 *
 * @param {number} [length] - The password length.
 * @param {string} [chars] - A string with the chars to use for password generation.
 * @returns {string} A random string
 */
exports.randomPassword = function(length = 12, chars) {
  let password = '';
  for (let i = 0; i < length; i++) {
    const char = randomChar(chars);
    password += char;
  }
  return password;
};

/**
 * Compute the checksum of the file given as parameter using a specified algorithm.
 *
 * @param {string} filePath - The file path.
 * @param {Object} options - Options.
 * @param {string} options.algorithm - For possible values, see https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options
 * @param {string} options.encoding - (optional) Hash encoding.
 * @returns {string} The file checksum.
 */
exports.fileChecksum = watt(function*(filePath, options, next) {
  const crypto = require('crypto');

  if (!options) {
    options = {};
  }
  if (!options.algorithm) {
    options.algorithm = 'sha1';
  }
  if (!options.encoding) {
    options.encoding = 'hex';
  }

  const stat = yield fs.stat(filePath, next);
  if (!stat.isFile()) {
    throw new Error(`${filePath} is not a file`);
  }

  const hash = crypto.createHash(options.algorithm);
  hash.setEncoding(options.encoding);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(
    hash,
    {end: false}
  );
  yield fileStream.once('end', next);

  hash.end();
  return hash.read();
});
