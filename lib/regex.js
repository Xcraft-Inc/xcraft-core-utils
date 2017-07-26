'use strict';

exports.toRegexp = function (value) {
  if (value instanceof RegExp) {
    return value;
  }

  var escapeStringRegexp = require ('escape-string-regexp');
  return new RegExp ('^' + escapeStringRegexp (value) + '$');
};

exports.toAxonRegExpStr = function (str) {
  const escape = require ('escape-regexp');
  str = escape (str);
  str = str.replace (/\\\*/g, '(.+)');
  return '^' + str + '$';
};
