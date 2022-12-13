'use strict';

const cache = {
  ca: null,
};

module.exports = {
  isCertificateError: function (err) {
    return (
      err.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
      err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      err.code === 'CERT_UNTRUSTED'
    );
  },
  tryLoadStoredCA: async function (err) {
    try {
      const {systemCertsAsync} = require('system-ca');
      cache.ca = await systemCertsAsync({includeNodeCertificates: true});
    } catch (err2) {
      console.warn(`cannot retrieve local certificates`, err2.message || err2);
      throw err;
    }
  },
  getStoredCA: function () {
    return cache.ca;
  },
};
