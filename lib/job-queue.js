'use strict';
var clc = require('cli-color');

const moduleName = 'job-queue';
const watt = require('gigawatts');
const {locks} = require('xcraft-core-utils');
const runner = require('./runnerInstance.js');
const throttle = require('lodash/throttle');
class JobQueue {
  constructor(name, runner, parallelLimit, useLogger = true) {
    this.log = useLogger && require('xcraft-core-log')(`${moduleName}`, null);
    this.name = name;
    this.channel = name.toLowerCase().replace(/\.|\[|\//g, '-');
    this.runner = watt(runner);
    this.parallelLimit = parallelLimit;
    this.waiting = new Map();
    this.running = 0;
    this._mutex = new locks.Mutex();
    const busClient = require('xcraft-core-busclient').getGlobal();
    this.resp = busClient.newResponse('job-queue', 'token');
    watt.wrapAll(this);
    this.notify = throttle(this._notify, 500);
  }

  _notify() {
    const n = this.waiting.size;
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

    this.log.info(
      `«${clc.blackBright.bold(this.name)}» waiting:${
        this.waiting.size
      } running:${this.running}`
    );
  }

  push(job) {
    try {
      this.waiting.set(job.id, job);
    } finally {
      setImmediate(this.notify.bind(this));
      setImmediate(runner.instance.run, this);
    }
  }
}

module.exports = JobQueue;
