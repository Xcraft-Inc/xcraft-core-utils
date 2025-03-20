//@ts-check
const crypto = require('node:crypto');
const traverse = require('xcraft-traverse');

function computeHash(payload) {
  const sha = crypto.createHash('sha256');
  const tr = traverse(payload);
  tr.forEach(function (x) {
    if (
      this.isLeaf &&
      (typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean')
    ) {
      sha.update(x === '' ? '\0' : `${x}`);
    }
  });
  return sha.digest('hex');
}

module.exports = {computeHash};
