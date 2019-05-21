'use strict';

var clc = require('cli-color');

const moduleName = 'job-queue';

class JobQueue {
  constructor(name, runner, parallelLimit, useLogger) {
    this.log = useLogger && require('xcraft-core-log')(`${moduleName}`, null);
    this.name = name;
    this.runner = runner;
    this.parallelLimit = parallelLimit;
    this.waiting = [];
    this.running = 0;
  }

  _log() {
    if (!this.log) {
      return;
    }

    /* FIXME: change dbg to info when it's no longer necessary */
    this.log.dbg(
      `«${clc.blackBright.bold(this.name)}» waiting:${
        this.waiting.length
      } running:${this.running}`
    );
  }

  run() {
    if (this.waiting.length === 0) {
      this._log();
      return;
    }

    if (this.running >= this.parallelLimit) {
      return;
    }
    const job = this.waiting.shift();
    this.running++;
    this._log();

    setImmediate(this.runner, job, () => {
      this.running--;
      this.run();
    });

    this.run();
  }

  push(job) {
    this.cancelExistingWaitingJob(job.id);
    this.waiting.push(job);
    setImmediate(this.run.bind(this));
  }

  cancelExistingWaitingJob(id) {
    this.waiting = this.waiting.filter(job => job.id !== id);
  }
}

module.exports = JobQueue;
