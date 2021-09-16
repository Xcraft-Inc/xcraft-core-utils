'use strict';

const watt = require('gigawatts');

class CursorPump {
  constructor(cursor) {
    this.cursor = cursor;
    watt.wrapAll(this);
  }

  *toArray() {
    let run = true;
    let results = [];
    do {
      try {
        const row = yield this.cursor.next();
        results.push(row);
      } catch {
        run = false;
      }
    } while (run);
    return results;
  }

  *pump() {
    return yield this.cursor.next();
  }
}
module.exports = CursorPump;
