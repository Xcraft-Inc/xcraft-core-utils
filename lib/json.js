'use strict';

var fs = require('fs');

/**
 * @deprecated Use fse.readJSONSync instead
 * @param {*} jsonFile
 * @returns
 */
exports.fromFile = function (jsonFile) {
  var data = fs.readFileSync(jsonFile, 'utf8');
  return JSON.parse(data);
};

/**
 * @deprecated Use fse.writeJSONSync instead
 * @param {*} json
 * @param {*} destFile
 */
exports.toFile = function (json, destFile) {
  fs.writeFileSync(destFile, JSON.stringify(json), 'utf8');
};
