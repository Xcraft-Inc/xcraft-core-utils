'use strict';

const got = require('got');
const {isCertificateError, getStoredCA, tryLoadStoredCA} = require('./ca.js');

function optionsWithCA(options) {
  const storedCA = getStoredCA();

  if (!storedCA) {
    return options;
  }

  return {
    ...options,
    ...{
      https: {
        ...options.https,
        ...{
          certificateAuthority:
            options && options.https && options.https.certificateAuthority
              ? options.https.certificateAuthority
              : storedCA,
        },
      },
    },
  };
}

async function gotEx(url, method, options) {
  try {
    return await got[method](url, optionsWithCA(options));
  } catch (err) {
    if (isCertificateError(err) && !getStoredCA()) {
      tryLoadStoredCA();
      return await got[method](url, optionsWithCA(options));
    } else {
      throw err;
    }
  }
}

module.exports = {
  get: async function (url, options) {
    return await gotEx(url, 'get', options);
  },
  put: async function (url, options) {
    return await gotEx(url, 'put', options);
  },
  post: async function (url, options) {
    return await gotEx(url, 'post', options);
  },
};
