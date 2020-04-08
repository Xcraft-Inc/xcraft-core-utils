'use strict';

exports.isFunction = function (fn) {
  return typeof fn === 'function';
};

exports.isGenerator = function (fn) {
  return (
    fn &&
    exports.isFunction(fn) &&
    fn.constructor &&
    fn.constructor.name === 'GeneratorFunction'
  );
};
