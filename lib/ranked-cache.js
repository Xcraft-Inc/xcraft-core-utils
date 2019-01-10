'use strict';

const EventEmitter = require('events');
const LinkedList = require('linked-list');

class RankedCache extends EventEmitter {
  constructor(limit) {
    super();

    this._limit = limit;
    this._size = 0;
    this._linkedList = new LinkedList();
  }

  /**
   * Push a new payload or an existing item in the linked cache.
   *
   * If the limit is reached, the older item is sent by event emitter to the
   * `out` topic.
   *
   * Note that a RankedCache with a limit <= 0 will just return null.
   *
   * @param {*} item - Push an item in the linked cache.
   * @returns {*} the ranked item (always wrapper in an Item).
   */
  rank(item) {
    if (this._limit <= 0) {
      return null;
    }

    const isNew = !(item instanceof LinkedList.Item);

    /* Create the item on the fly if necessary. */
    if (isNew) {
      const _item = new LinkedList.Item();
      _item.payload = item;
      item = _item;
    }

    /* Limit the cache to this._limit entries. The less used item is deleted
     * when the limit is reached.
     */
    if (this._size === this._limit) {
      const prevItem = this._linkedList.head;
      prevItem.detach();
      this._size--;
      this.emit('out', prevItem);
    }

    if (item.list) {
      /* When an existing style is used, detach from its current position
       * and move of one step in the linked-list. The goal is to keep the less
       * used items in front of the list (head).
       */
      const nextItem = item.next;
      if (nextItem) {
        item.detach();
        nextItem.append(item);
      }
    } else {
      /* Add the item to the end of the list. Here, it's still not possible to
       * be sure that this item will be often used. Anyway, if it's not used
       * anymore, it will move one-by-one to the front of the list.
       */
      this._linkedList.append(item);
      this._size++;
    }

    return item;
  }

  /**
   * Clear the whole RankedCache.
   *
   * All items are sent to the 'out' event.
   */
  clear() {
    let item;
    while ((item = this._linkedKist.head)) {
      item.detach();
      this.emit('out', item);
    }
  }
}

module.exports = RankedCache;
