'use strict';

const watt = require('gigawatts');
const locks = require('locks');

class Semaphore {
  constructor(initialValue = 1) {
    this._sem = locks.createSemaphore(initialValue);
    watt.wrappAll(this);
  }

  *wait(next) {
    yield this._sem.wait(next);
  }

  signal() {
    this._sem.signal();
  }
}

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

  *lock(owner, next) {
    if (!owner) {
      throw new Error('owner missing');
    }

    if (this._mutex.isLocked && owner === this._owner) {
      ++this._refCount;
      return; /* Same owner, continue because already locked */
    }

    yield* super.lock(next);
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

class GetMutex {
  constructor() {
    this._mutexes = {};
    watt.wrapAll(this);
  }

  _cleanupMutex(key) {
    if (!this._mutexes[key] || this._mutexes[key].isLocked) {
      return;
    }
    delete this._mutexes[key];
  }

  *lock(key, next) {
    if (this._mutexes[key]) {
      yield this._mutexes[key].lock(next.arg(0));
      return;
    }

    this._mutexes[key] = locks.createMutex();
    yield this._mutexes[key].lock(next.arg(0));
  }

  unlock(key) {
    this._mutexes[key].unlock();
    this._cleanupMutex(key);
  }
}

module.exports = {
  Mutex,
  RecursiveMutex,
  Semaphore,
  getMutex: new GetMutex(),
};
