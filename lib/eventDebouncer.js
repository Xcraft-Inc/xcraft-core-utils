'use strict';

const {debounce} = require('lodash');

class EventDebouncer {
  constructor(resp, wait = 1000) {
    this.debouncers = {};
    this.wait = wait;
    this.resp = resp;
  }

  publish(topic, data) {
    if (!this.debouncers[topic]) {
      const send = (topic, data) => this.resp.events.send(topic, data);
      this.debouncers[topic] = debounce(send, this.wait);
    }
    this.debouncers[topic](topic, data);
  }
}

module.exports = EventDebouncer;
