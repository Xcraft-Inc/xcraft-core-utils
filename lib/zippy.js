'use strict';
const path = require('node:path');
const fse = require('fs-extra');
const {Readable, Writable} = require('node:stream');
const {ZipWriter} = require('@zip.js/zip.js');
const {string, boolean} = require('xcraft-core-stones');

class ZippyOptions {
  password = string;
  zipCrypto = boolean;
}

/**
 *
 * @param {*} files
 * @param {*} outputStream
 * @param {t<ZippyOptions>} [options]
 */
async function zippy(files, outputStream, options) {
  const zipWriter = new ZipWriter(Writable.toWeb(outputStream), options);

  for (const file of files) {
    const name = path.basename(file);
    const fileStream = fse.createReadStream(file);
    const readableStream = Readable.toWeb(fileStream);
    await zipWriter.add(name, readableStream);
  }

  await zipWriter.close();
}

module.exports = zippy;
