'use strict';

var clc = require('cli-color');

const moduleName = 'job-queue';
const watt = require('gigawatts');
const {locks} = require('xcraft-core-utils');
const throttle = require('lodash/throttle');
class JobQueue {
  constructor(name, runner, parallelLimit, useLogger = true) {
    this.log = useLogger && require('xcraft-core-log')(`${moduleName}`, null);
    this.name = name;
    this.channel = name.toLowerCase().replace(/\.|\[|\//g, '-');
    this.runner = runner;
    this.parallelLimit = parallelLimit;
    this.waiting = [];
    this.running = 0;
    this._mutex = new locks.Mutex();
    const busClient = require('xcraft-core-busclient').getGlobal();
    this.resp = busClient.newResponse('job-queue', 'token');
    watt.wrapAll(this);
    this.notify = throttle(this._notify, 500);
  }

  _notify(n) {
    this.resp.events.send('job-queue.sampled', {
      channel: this.channel,
      sample: n,
      current: 0,
      total: 0,
    });
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

    const n = this.waiting.length;
    this.notify(n);

    this.running++;
    this._log();

    setImmediate(this.runner, job, () => {
      this.running--;
      this.run();
    });

    this.run();
  }

  *push(job) {
    yield this._mutex.lock();
    try {
      this.cancelExistingWaitingJob(job.id);
      this.waiting.push(job);
    } catch (ex) {
      throw ex;
    } finally {
      this._log();
      this._mutex.unlock();
      this.run();
    }
  }

  cancelExistingWaitingJob(id) {
    this.waiting = this.waiting.filter((job) => job.id !== id);
  }
}

module.exports = JobQueue;
