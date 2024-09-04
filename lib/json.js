'use strict';

var fs = require('fs');
const traverse = require('xcraft-traverse');

/**
 * @deprecated Use fse.readJSONSync instead
 * @param {*} jsonFile
 * @returns {object}
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

/**
 * Convert keys with dots into objects
 * @example
 * // from
 * {
 *   "foo.bar": true
 * }
 * // to
 * {
 *   "foo": {
 *     "bar": true
 *   }
 * }
 *
 * @param {*} json
 * @returns {object}
 */
exports.dotKeysToObject = function (json) {
  const tr = traverse(json);
  return tr.reduce(function (acc, x) {
    if (!this.key || !this.isLeaf) {
      return acc;
    }

    const keys = this.path.reduce((acc, k) => {
      const keys = k.split('.');
      acc.push(...keys);
      return acc;
    }, []);
    let it = acc;
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (!it[key] && i < keys.length - 1) {
        it[key] = Array.isArray(tr.get(keys.slice(0, i + 1))) ? [] : {};
        it = it[key];
      } else if (i === keys.length - 1) {
        if (Array.isArray(it[key])) {
          it[key].push(x);
        } else {
          it[key] = x;
        }
      } else {
        it = it[key];
      }
    }
    return acc;
  }, {});
};
