'use strict';

var clc = require('cli-color');

const moduleName = 'job-queue';
const watt = require('gigawatts');
const {locks} = require('xcraft-core-utils');
const Database = require('better-sqlite3');

class PersistantJobQueue {
  constructor(
    path,
    name,
    runner,
    parallelLimit,
    useLogger = true,
    options = {}
  ) {
    // Status db
    this.db = new Database(path, options);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS JobQueue (
        jobId TEXT PRIMARY KEY,
        topic TEXT,
        order NUMBER,
        status TEXT,
        payload TEXT,
      )
    `);

    this.insertJob = this.db.prepare(`
      INSERT INTO JobQueue (jobId,topic,order,status, payload)
      VALUES ($jobId, $topic, $order, $status, $payload);
    `);

    this.getJob = this.db.prepare(`
      SELECT * FROM JobQueue WHERE (status='waiting' || status ='running') ORDER BY order;
    `);

    this.changeJobStatus = this.db.prepare(`
      UPDATE JobQueue
      SET status=$status
      WHERE jobId=$jobId;
    `);

    this.deleteJobDone = this.db.prepare(`
      DELETE FROM JobQueue WHERE jobId=$jobId;
    `);

    this.getJobsCount = () => {
      const row = this.db.prepare(
        `SELECT COUNT(*) as count FROM JobQueue WHERE (status='waiting' || status='running');`
      );
      return parseInt(row.get()[0].count);
    };

    this.count = this.getJobsCount();

    this.log = useLogger && require('xcraft-core-log')(`${moduleName}`, null);
    this.name = name;
    this.runner = runner;
    this.parallelLimit = parallelLimit;
    this.running = 0;
    this._mutex = new locks.Mutex();
    watt.wrapAll(this);
  }

  _log() {
    if (!this.log) {
      return;
    }

    const count = this.getJobsCount();

    /* FIXME: change dbg to info when it's no longer necessary */
    this.log.dbg(
      `«${clc.blackBright.bold(this.name)}» waiting:${count} running:${
        this.running
      }`
    );
  }

  run() {
    if (this.getJobsCount() === 0) {
      this._log();
      return;
    }

    if (this.running >= this.parallelLimit) {
      return;
    }

    // Change status running
    const job = this.getJob.get()[this.running];
    this.changeJobStatus({jobId: job.id, status: 'running'});
    this.running++;
    this._log();

    setImmediate(this.runner, job.payload, () => {
      this.deleteJobDone({jobId: job.id});
      this.run();
    });

    this.run();
  }

  *push(job) {
    yield this._mutex.lock();
    try {
      this.insertJob.run({
        jobId: job.id,
        topic: job.topic,
        order: this.count,
        status: 'waiting',
        payload: job,
      });
      this.count++;
    } catch (ex) {
      throw ex;
    } finally {
      this._log();
      this._mutex.unlock();
      this.run();
    }
  }

  //cancelExistingWaitingJob(id) {
  //  this.waiting = this.waiting.filter(job => job.id !== id);
  //}
}

module.exports = PersistantJobQueue;
