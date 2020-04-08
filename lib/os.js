'use strict';

const os = require('os');
const path = require('path');

exports.getAppData = function () {
  return (
    (process.platform === 'win32' && process.env.APPDATA) ||
    (process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library/Application Support')
      : path.join(os.homedir(), '.local/share'))
  );
};
