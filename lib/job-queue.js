'use strict';

class JobQueue {
  constructor(name, runner, parallelLimit) {
    this.name = name;
    this.runner = runner;
    this.parallelLimit = parallelLimit;
    this.waiting = [];
    this.running = 0;
  }

  run() {
    if (this.waiting.length === 0) {
      return;
    }

    if (this.running >= this.parallelLimit) {
      return;
    }
    const job = this.waiting.shift();
    this.running++;
    console.log(`${this.name} job queue status: 
    waiting: ${this.waiting.length}
    running: ${this.running}`);
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
