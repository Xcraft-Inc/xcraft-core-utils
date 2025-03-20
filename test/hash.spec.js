'use strict';

const {expect} = require('chai');
const {computeHash} = require('../lib/hash.js');

describe('goblin.yennefer.hash', function () {
  it('string', function () {
    const objL = {string: 'Roger'};
    const objR = {string: 'Wilco'};

    const L = computeHash(objL);
    const R = computeHash(objR);

    expect(L).to.not.be.equal(R);
  });

  it('number', function () {
    const objL = {number: 42};
    const objR = {number: 1548};

    const L = computeHash(objL);
    const R = computeHash(objR);

    expect(L).to.not.be.equal(R);
  });

  it('boolean', function () {
    const objL = {boolean: true};
    const objR = {boolean: false};

    const L = computeHash(objL);
    const R = computeHash(objR);

    expect(L).to.not.be.equal(R);
  });

  it('empty', function () {
    const objL = {empty: ''};
    const objR = {empty: null};

    const L = computeHash(objL);
    const R = computeHash(objR);

    expect(L).to.not.be.equal(R);
  });
});
