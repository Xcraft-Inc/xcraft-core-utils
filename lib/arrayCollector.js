const {throttle} = require('lodash');
const watt = require('gigawatts');

class ArrayCollector {
  constructor(wait = 20, onCollect) {
    this.onCollect = watt(onCollect);
    this.entries = {};
    const busClient = require('xcraft-core-busclient').getGlobal();
    this.resp = busClient.newResponse('collector', 'token');
    this.release = throttle(this._release, wait);
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
}

module.exports = ArrayCollector;
