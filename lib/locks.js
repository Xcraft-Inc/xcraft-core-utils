'use strict';

const watt = require('gigawatts');
const locks = require('locks');

class Semaphore {
  constructor(initialValue = 1) {
    this._sem = locks.createSemaphore(initialValue);
    watt.wrapAll(this, 'wait');
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
    watt.wrapAll(this, 'lock');
  }

  *lock(next) {
    yield this._mutex.lock(next.arg(0));
  }

  unlock() {
    this._mutex.unlock();
  }

  get isLocked() {
    return this._mutex.isLocked;
  }
}

class RecursiveMutex extends Mutex {
  constructor() {
    super();
    this._owner = null;
    this._refCount = 0;
    watt.wrapAll(this, 'lock');
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
  #mutexes = new Map();

  constructor() {
    watt.wrapAll(this, 'lock');
  }

  #cleanupMutex(key) {
    if (!this.#mutexes.has(key) || this.#mutexes.get(key).isLocked) {
      return;
    }
    this.#mutexes.delete(key);
  }

  *lock(key, next) {
    if (!this.#mutexes.has(key)) {
      this.#mutexes.set(key, locks.createMutex());
    }
    yield this.#mutexes.get(key).lock(next.arg(0));
  }

  unlock(key) {
    this.#mutexes.get(key)?.unlock();
    this.#cleanupMutex(key);
  }
}

class CoalescingExecutor {
  #running;
  #pending;

  async run(work) {
    if (this.#running) {
      /* Keep the last one */
      this.#pending = work;
      await this.#running;
      return;
    }

    /* The first */
    this.#running = (async () => {
      await work();

      /* Run the last if exists */
      while (this.#pending) {
        const last = this.#pending;
        this.#pending = null;
        await last();
      }
    })();

    await this.#running;
    this.#running = null;
  }
}

module.exports = {
  Mutex,
  RecursiveMutex,
  Semaphore,
  CoalescingExecutor,
  getMutex: new GetMutex(),
};
