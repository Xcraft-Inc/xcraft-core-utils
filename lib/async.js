'use strict';

const watt = require('gigawatts');

class Async {
  constructor() {
    watt.wrapAll(this);
  }

  /**
   * Reduce an array to a map with an async iteration.
   *
   * It's useful in the case where the main event loop must not
   * be blocked and the array is very large. The purpose of this
   * helper is only for task which be done with an usual sync
   * map reduce.
   * @yields
   * @param {*} keyFunc - Key for the item in the map.
   * @param {*} valueFunc - Value for the item in the map.
   * @param {*} list - The input array.
   * @returns {object} the map.
   */
  *mapReduce(keyFunc, valueFunc, list) {
    const state = {};
    for (const item of list) {
      state[keyFunc(item)] = yield new Promise((resolve) =>
        resolve(valueFunc(item))
      );
    }
    return state;
  }
}

module.exports = new Async();
