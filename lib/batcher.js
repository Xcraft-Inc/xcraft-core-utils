class Batcher {
  #call = false;
  #batch;
  #counter = 0;
  #timeout;
  #timer;

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

  async start() {
    await this.#begin();
    this.#timer = setTimeout(() => {
      this.#call = true;
    }, this.#timeout);
  }

  async bump() {
    this.#counter++;
    if (this.#call || this.#counter % this.#batch === 0) {
      await this.stop();
      await this.start();
    }
  }

  async pump() {
    if (this.#call) {
      await this.stop();
      await this.start();
    }
  }

  async stop() {
    const batch = this.#counter;
    this.#clear();
    await this.#commit(batch);
  }
}

module.exports = Batcher;
