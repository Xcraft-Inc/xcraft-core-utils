'use strict';

const {expect} = require('chai');
const {CoalescingExecutor} = require('../lib/locks.js');
const {setTimeout: setTimeoutAsync} = require('node:timers/promises');

describe('xcraft.utils.locks', function () {
  it('barrier', async function () {
    const results = [];
    const promises = [];
    const barrier = new CoalescingExecutor();

    promises.push(
      barrier.run(async () => {
        await setTimeoutAsync(100);
        results.push(0);
      })
    );
    promises.push(
      barrier.run(async () => {
        await setTimeoutAsync(20);
        results.push(1);
      })
    );
    promises.push(
      barrier.run(async () => {
        await setTimeoutAsync(100);
        results.push(2);
      })
    );

    await Promise.all(promises);
    expect(results).to.deep.equal([0, 2]);
  });
});
