'use strict';

const fse = require('fs-extra');

exports.fromFile = function (yamlFile) {
  const yaml = require('js-yaml');
  const data = fse.readFileSync(yamlFile, 'utf8');
  return yaml.safeLoad(data);
};

exports.toFile = function (data, yamlFile) {
  const yaml = require('js-yaml');
  data = yaml.safeDump(data, {lineWith: 999});
  fse.writeFileSync(yamlFile, data, 'utf8');
};
