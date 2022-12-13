'use strict';

const got = require('./network/got.js');

class Network {
  static get got() {
    return got;
  }
}

module.exports = Network;
