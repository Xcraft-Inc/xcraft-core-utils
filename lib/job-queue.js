'use strict';

const moduleName = 'job-queue';
const colors = require('picocolors');
const watt = require('gigawatts');
const {locks} = require('xcraft-core-utils');
const runner = require('./runnerInstance.js');
const throttle = require('lodash/throttle');
const defaultOptions = {
  priorityGroup: 'default',
  waitOn: [], //groups to wait
  waitDelay: 50,
  maxAttempt: 100,
  useLogger: false,
};
class JobQueue {
  constructor(name, runner, parallelLimit, options) {
    //override default options
    if (!options) {
      options = defaultOptions;
    } else {
      options = {...defaultOptions, ...options};
    }

    this.log =
      options.useLogger && require('xcraft-core-log')(`${moduleName}`, null);
    this.name = name;
    this.priorityGroup = options.priorityGroup;
    this.waitOn = options.waitOn;
    this.maxAttempt = options.maxAttempt;
    this.attempt = 0;
    this.waitDelay = options.waitDelay;
    this.channel = name.toLowerCase().replace(/\.|\[|\//g, '-');
    this.runner = watt(function* (...args) {
      this.notify(++this.runningSamples, true);
      try {
        yield* runner(...args);
      } finally {
        this.notify(--this.runningSamples, true);
      }
    });
    this.parallelLimit = parallelLimit;
    this.waiting = new Map();
    this.running = 0;
    this.runningSamples = 0;
    this._mutex = new locks.Mutex();
    const busClient = require('xcraft-core-busclient').getGlobal();
    this.resp = busClient.newResponse('job-queue', 'token');
    watt.wrapAll(this);
    this.notify = throttle(this._notify, 500).bind(this);
  }

  get maxAttemptReached() {
    return this.attempt >= this.maxAttempt;
  }

  _notify(sample, hold) {
    this.resp.events.send('<job-queue.sampled>', {
      channel: this.channel,
      sample,
      current: 0,
      total: 0,
      hold,
    });
  }

  _log() {
    if (!this.log) {
      return;
    }

    const msg = `«${colors.blackBright(colors.bold(this.name))}» waiting:${
      this.waiting.size
    } running:${this.running}`;
    this.log.info(msg);
  }

  _dbg(debugMessage) {
    if (!this.log) {
      return;
    }

    const msg = `«${colors.blackBright(colors.bold(this.name))}» ${debugMessage}`;
    this.log.dbg(msg);
  }

  err(ex) {
    const msg = `«${colors.blackBright(colors.bold(this.name))}» ${
      ex.stack || ex.message || ex
    }`;

    if (!this.log) {
      console.error(msg);
      return;
    }

    this.log.err(msg);
  }

  push(job) {
    try {
      this.waiting.set(job.id, job);
    } finally {
      //launch macro-task
      setTimeout(runner.instance.run, 0, this);
    }
  }

  dispose() {
    this.notify(0, false);
    this.resp.events.send('<job-queue.disposed>', {
      channel: this.channel,
    });
  }
}

module.exports = JobQueue;
