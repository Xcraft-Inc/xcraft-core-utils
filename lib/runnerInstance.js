'use strict';

// create a unique, global symbol name
// -----------------------------------
const RUNNER_INSTANCE_KEY = Symbol.for('xcraft-core-utils.runnerInstance');
const watt = require('gigawatts');

class Runner {
  constructor() {
    this.totalRunning = 0;
    this.runningsGroups = [];
    this.runnings = {};
    this.run = this.run.bind(this);
    watt.wrapAll(this);
  }

  run(jobQueue) {
    //must be postponed?
    if (jobQueue.waitOn.length > 0) {
      const mustWait = this.runningsGroups.some((q) =>
        jobQueue.waitOn.includes(q)
      );
      if (mustWait) {
        if (!jobQueue.maxAttemptReached) {
          jobQueue.attempt++;
          setTimeout(this.run, jobQueue.waitDelay, jobQueue);
          return;
        } else {
          jobQueue.attempt = 0;
        }
      }
    }

    //queue is draining?
    if (jobQueue.running > 0 && jobQueue.waiting.size === 0) {
      return;
    }

    //jobqueue releasing
    for (let x = jobQueue.running; x < jobQueue.parallelLimit; x++) {
      const nextEntry = jobQueue.waiting.entries().next();
      if (nextEntry.done) {
        //we can leave, nothing is waiting us
        break;
      }

      //remove the jobEntry from queue
      const jobEntry = Object.assign({}, nextEntry.value);
      jobQueue.waiting.delete(jobEntry[0]);

      //log for journal inspections
      if (this.totalRunning === 0 && jobQueue.parallelLimit > 1) {
        jobQueue._dbg(`system are running new jobs`);
      }

      //priority tracking
      if (jobQueue.priorityGroup !== 'default' && jobQueue.running === 0) {
        if (!this.runnings[jobQueue.priorityGroup]) {
          this.runnings[jobQueue.priorityGroup] = {};
        }
        this.runnings[jobQueue.priorityGroup][jobQueue.name] = true;
        //update runnings group
        this.runningsGroups = Object.entries(this.runnings)
          .filter((e) => Object.values(e[1]).some((r) => r === true))
          .map((e) => e[0]);
      }

      //update counters
      this.totalRunning++;

      //trigger job start on queue runner
      jobQueue.runner(jobEntry[1], (err) => {
        if (err) {
          jobQueue.err(err);
        }
        //end callback

        jobQueue.notify(jobQueue.runningSamples);

        //update counter
        jobQueue.running--;
        this.totalRunning--;

        //priority tracking
        if (jobQueue.priorityGroup !== 'default' && jobQueue.running === 0) {
          this.runnings[jobQueue.priorityGroup][jobQueue.name] = false;
          //update runnings group
          this.runningsGroups = Object.entries(this.runnings)
            .filter((e) => Object.values(e[1]).some((r) => r === true))
            .map((e) => e[0]);
        }

        //log
        if (this.totalRunning === 0 && jobQueue.waiting.size === 0) {
          jobQueue._dbg(`no more jobs running`);
        }

        //schedule a new run for this queue if needed
        if (jobQueue.waiting.size > 0) {
          setTimeout(this.run, 0, jobQueue);
        }
      });
    }
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
