'use strict';

const {throttle} = require('lodash');
const watt = require('gigawatts');

class ArrayCollector {
  constructor(resp, wait = 20, onCollect, leading = true) {
    this.onCollect = watt(onCollect);
    this.entries = {};
    this.resp = resp;
    this.release = throttle(this._release, wait, {leading});
  }

  _release() {
    const copy = this.entries;
    this.entries = {};
    this.onCollect(copy, this.resp);
  }

  _addByKey(key, data) {
    if (!this.entries[key]) {
      this.entries[key] = [];
    }
    this.entries[key] = this.entries[key].concat(data);
  }

  grab(key, data) {
    this._addByKey(key, data);
    this.release();
  }

  cancel() {
    this.release.cancel();
  }
}

module.exports = ArrayCollector;
