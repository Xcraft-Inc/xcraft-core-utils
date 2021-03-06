'use strict';

exports.camelcasify = function (str) {
  return str.replace(/(\.[a-z])/g, function (match) {
    return match.replace('.', '').toUpperCase();
  });
};

exports.capitalize = function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

exports.jsify = (str) => {
  return str.replace(/-([a-z])/g, (m, g1) => g1.toUpperCase());
};
