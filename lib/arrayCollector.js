'use strict';

const {throttle} = require('lodash');
const watt = require('gigawatts');

class ArrayCollector {
  constructor(resp, wait = 20, onCollect, leading = true, async = false) {
    this._async = async;
    if (!async) {
      this.onCollect = watt(onCollect);
    } else {
      this.onCollect = onCollect;
    }
    this.entries = {};
    this.resp = resp;
    this.release = throttle(this._release, wait, {leading});
    this.releaseAsync = throttle(this._releaseAsync, wait, {leading});
  }

  async _releaseAsync() {
    const copy = this.entries;
    this.entries = {};
    try {
      await this.onCollect(copy, this.resp);
    } catch (err) {
      this.resp.log.err(err);
    }
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
    if (this._async) {
      this.releaseAsync();
    } else {
      this.release();
    }
  }

  cancel() {
    if (this._async) {
      this.releaseAsync.cancel();
    } else {
      this.release.cancel();
    }
  }
}

module.exports = ArrayCollector;
