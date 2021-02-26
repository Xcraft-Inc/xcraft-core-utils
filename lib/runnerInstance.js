// create a unique, global symbol name
// -----------------------------------
const RUNNER_INSTANCE_KEY = Symbol.for('xcraft-core-utils.runnerInstance');
const watt = require('gigawatts');

class Runner {
  constructor() {
    this.totalRunning = 0;
    watt.wrapAll(this);
  }

  *run(jobQueue, next) {
    if (jobQueue.running > 0 && jobQueue.waiting.size === 0) {
      return;
    }
    yield jobQueue._mutex.lock();
    for (let x = jobQueue.running; x < jobQueue.parallelLimit; x++) {
      setTimeout(jobQueue._log.bind(jobQueue), 1);

      const nextEntry = jobQueue.waiting.entries().next();
      if (nextEntry.done) {
        break;
      }
      const jobEntry = Object.assign({}, nextEntry.value);
      jobQueue.waiting.delete(jobEntry[0]);

      if (this.totalRunning === 0 && jobQueue.parallelLimit > 1) {
        jobQueue._dbg(`this queue is now running new jobs`);
      }
      jobQueue.running++;
      this.totalRunning++;
      setImmediate(() =>
        jobQueue.runner(jobEntry[1], () => {
          jobQueue.running--;
          this.totalRunning--;
          if (this.totalRunning === 0 && jobQueue.waiting.size === 0) {
            jobQueue._dbg(
              `this queue is now empty, and there is no more jobs running`
            );
          }
          setTimeout(jobQueue._log.bind(jobQueue), 1);
          if (jobQueue.waiting.size > 0) {
            setImmediate(this.run, jobQueue);
          }
        })
      );
    }
    jobQueue._mutex.unlock();
  }
}

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------
const globalSymbols = Object.getOwnPropertySymbols(global);
const hasInstance = globalSymbols.indexOf(RUNNER_INSTANCE_KEY) > -1;
if (!hasInstance) {
  global[RUNNER_INSTANCE_KEY] = new Runner();
}

// define the singleton API
// ------------------------

const singleton = {};

Object.defineProperty(singleton, 'instance', {
  get: function () {
    return global[RUNNER_INSTANCE_KEY];
  },
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------
module.exports = singleton;
