'use strict';

const {throttle} = require('lodash');

class MapAggregator {
  constructor(resp, wait = 20, onCollect, leading = true) {
    this._onCollect = onCollect;
    this._entries = {};
    this._resp = resp;
    this._release = throttle(this._release, wait, {leading});
  }

  _release() {
    const copy = this._entries;
    this._entries = {};
    this._onCollect(copy, this._resp);
  }

  _putByKeys(keys, data) {
    let obj = this._entries;
    let parent;
    for (const key of keys) {
      if (!obj[key]) {
        obj[key] = {};
      }
      parent = obj;
      obj = obj[key];
    }
    parent[keys[keys.length - 1]] = data;
  }

  put(keys, data) {
    if (!Array.isArray(keys)) {
      keys = keys.split('.');
    }
    this._putByKeys(keys, data);
    this._release();
  }
}

module.exports = MapAggregator;
