'use strict';

const escape = require ('escape-regexp');

exports.toRegexp = function (value) {
  if (value instanceof RegExp) {
    return value;
  }

  var escapeStringRegexp = require ('escape-string-regexp');
  return new RegExp ('^' + escapeStringRegexp (value) + '$');
};

exports.toAxonRegExpStr = function (str) {
  str = escape (str).replace (/\\\*/g, '(.+)');
  return '^' + str + '$';
};

exports.toXcraftRegExpStr = function (str) {
  str = escape (str)
    .replace (/\\\((.+)\\\)/g, m => m.replace (/\\/g, ''))
    .replace (/\\\*/g, '(.+)');
  return '^' + str + '$';
};
