'use strict';

class Batcher {
  #call = false;
  #batch;
  #counter = 0;
  #timeout;
  #timer;
  #disposing = false;
  #running = false;

  #begin;
  #commit;

  constructor(begin, commit, batch = 500, timeout = 5000) {
    this.#begin = begin;
    this.#commit = commit;
    this.#batch = batch;
    this.#timeout = timeout;
  }

  #clear() {
    this.#counter = 0;
    this.#call = false;
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  #tick() {
    return new Promise((resolve) => setImmediate(resolve));
  }

  async start() {
    this.#running = true;
    await this.#begin();
    this.#timer = setTimeout(() => {
      this.#call = true;
    }, this.#timeout);
  }

  async bump() {
    if (this.#disposing) {
      await this.stop();
      return false;
    }

    this.#counter++;
    if (this.#call || this.#counter % this.#batch === 0) {
      await this.stop();
      await this.start();
    }
    return true;
  }

  async pump() {
    await this.#tick();

    if (this.#disposing) {
      await this.stop();
      return false;
    }

    if (this.#call) {
      await this.stop();
      await this.start();
    }
    return true;
  }

  async stop() {
    const batch = this.#counter;
    this.#clear();
    if (this.#running) {
      await this.#commit(batch);
    }
    this.#running = false;
  }

  dispose() {
    this.#disposing = true;
  }
}

module.exports = Batcher;
