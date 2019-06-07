const xUtils = require('../index.js');
const jobs1 = [
  {id: 1, gen: 0},
  {id: 1, gen: 1},
  {id: 1, gen: 4},
  {id: 1, gen: 5},
  {id: 2, gen: 1},
  {id: 2, gen: 2},
  {id: 2, gen: 3},
  {id: 4, gen: 0},
];
const jobs2 = [
  {id: 1, gen: 2},
  {id: 1, gen: 3},
  {id: 1, gen: 6},
  {id: 1, gen: 7},
  {id: 1, gen: 8},
  {id: 1, gen: 9},
  {id: 1, gen: 10},
  {id: 3, gen: 0},
];
const runner = (job, done) => {
  setTimeout(() => {
    console.log(`[id:${job.id}] gen:${job.gen}`);
    done();
  }, 1000);
};

const queue = new xUtils.JobQueue('test', runner, 1);

const watt = require('gigawatts');

const run1 = watt(function*(next) {
  for (const j of jobs1.values()) {
    yield queue.push(j);
  }
});
const run2 = watt(function*(next) {
  for (const j of jobs2.values()) {
    yield queue.push(j);
  }
});

run2();
run1();
