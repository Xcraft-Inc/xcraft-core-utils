'use strict';

const AsyncFunction = (async () => {}).constructor;
const GeneratorFunction = function* () {}.constructor;

exports.isFunction = function (fn) {
  return typeof fn === 'function';
};

exports.isGenerator = function (fn) {
  return fn && fn instanceof GeneratorFunction === true;
};
