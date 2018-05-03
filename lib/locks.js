'use strict';

const watt = require('watt');
const locks = require('locks');

class Mutex {
  constructor() {
    this._mutex = locks.createMutex();
    watt.wrapAll(this);
  }

  *lock(next) {
    yield this._mutex.lock(next.arg(0));
  }

  unlock() {
    this._mutex.unlock();
  }
}

class RecursiveMutex extends Mutex {
  constructor() {
    super();
    this._owner = null;
    this._refCount = 0;
    watt.wrapAll(this);
  }

  *lock(owner) {
    if (!owner) {
      throw new Error('owner missing');
    }

    if (this._mutex.isLocked && owner === this._owner) {
      ++this._refCount;
      return; /* Same owner, continue because already locked */
    }

    yield super.lock();
    this._owner = owner;
    ++this._refCount;
  }

  unlock(owner) {
    if (owner !== this._owner) {
      throw new Error('bad owner');
    }

    --this._refCount;
    if (this._refCount < 1) {
      this._owner = null;
      super.unlock();
    }
  }
}

module.exports = {
  Mutex,
  RecursiveMutex,
};
