'use strict';

const fse = require('fs-extra');

exports.fromFile = function (yamlFile) {
  const yaml = require('js-yaml');
  const data = fse.readFileSync(yamlFile, 'utf8');
  return yaml.safeLoad(data);
};
