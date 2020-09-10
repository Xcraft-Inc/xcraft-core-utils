const {debounce} = require('lodash');

class EventDebouncer {
  constructor(wait = 1000) {
    this.debouncers = {};
    this.wait = wait;
    const busClient = require('xcraft-core-busclient').getGlobal();
    this.resp = busClient.newResponse('event-debouncer', 'token');
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
