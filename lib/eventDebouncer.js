const {debounce} = require('lodash');

class EventDebouncer {
  constructor(resp, wait = 1000) {
    this.debouncers = {};
    this.wait = wait;
    this.resp = resp;
  }

  publish(topic) {
    if (!this.debouncers[topic]) {
      const send = (topic) => this.resp.events.send(topic);
      this.debouncers[topic] = debounce(send, this.wait);
    }
    this.debouncers[topic](topic);
  }
}

module.exports = EventDebouncer;
