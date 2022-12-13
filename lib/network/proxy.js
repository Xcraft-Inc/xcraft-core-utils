'use strict';

let proxyBeenDetected = false;

function getInternetSettingsKeys(registry) {
  return [
    {
      hive: registry.HKEY_CURRENT_USER,
      keyName:
        'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    },
    {
      hive: registry.HKEY_LOCAL_MACHINE,
      keyName:
        'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    },
  ];
}

function shouldFilterProxyUrl(url) {
  const invalidProxies = [
    {
      url: 'http://http=localhost',
      port: '*',
    },
  ];

  for (let proxy of invalidProxies) {
    if (proxy.port === '*') {
      // any port
      if (url.startsWith(proxy.url)) {
        return true;
      }
    } else {
      // specific port
      const invalidUrl = `${proxy.url}:${proxy.port}`;
      if (url === invalidUrl) {
        return true;
      }
    }
  }

  return false;
}

function tryInitializeNetworkStackFromEnvironment() {
  try {
    const {HTTP_PROXY, HTTPS_PROXY, NO_PROXY} = process.env;
    if (HTTP_PROXY || HTTPS_PROXY) {
      if (NO_PROXY) {
        process.env['WESTEROS_NO_PROXY'] = NO_PROXY;
      }
      if (HTTP_PROXY && !HTTP_PROXY.startsWith('http://')) {
        process.env['WESTEROS_HTTP_PROXY'] = `http://${HTTP_PROXY}`;
      }
      if (HTTPS_PROXY && !HTTPS_PROXY.startsWith('https://')) {
        process.env['WESTEROS_HTTPS_PROXY'] = `https://${HTTPS_PROXY}`;
      }

      return true;
    }
  } catch (err) {
    console.warn(
      `cannot initialize network stack for proxy from environment: ${
        err.message || err
      }`
    );
  }

  return false;
}

async function tryInitializeNetworkStackFromInternetSettings() {
  try {
    const os = require('os');
    if (os.platform() === 'win32') {
      const registry = require('node-windows-registry');

      for (let key of getInternetSettingsKeys(registry)) {
        try {
          const internetSettingsKey = await registry.openKey(key.keyName, {
            hive: key.hive,
            view: registry.x64,
          });

          let proxyEnabled = false;
          let proxyServer = '';

          try {
            proxyEnabled = await internetSettingsKey.getValue('ProxyEnable');
          } catch (err3) {
            internetSettingsKey.dispose();
            if (registry.isNotFoundError(err3)) {
              continue;
            } else {
              throw err3;
            }
          }

          if (proxyEnabled === 1) {
            try {
              proxyServer = await internetSettingsKey.getValue('ProxyServer');
              internetSettingsKey.dispose();

              if (proxyServer && !shouldFilterProxyUrl(proxyServer)) {
                if (proxyServer.startsWith('http://')) {
                  process.env['WESTEROS_HTTP_PROXY'] = proxyServer;
                  process.env['WESTEROS_HTTPS_PROXY'] = proxyServer.replace(
                    /http:\/\//g,
                    'https://'
                  );
                } else if (proxyServer.startsWith('https://')) {
                  process.env['WESTEROS_HTTP_PROXY'] = proxyServer.replace(
                    /https:\/\//g,
                    'http://'
                  );
                  process.env['WESTEROS_HTTPS_PROXY'] = proxyServer;
                } else {
                  process.env['WESTEROS_HTTP_PROXY'] = `http://${proxyServer}`;
                  process.env[
                    'WESTEROS_HTTPS_PROXY'
                  ] = `https://${proxyServer}`;
                }

                return true;
              }
            } catch (err3) {
              internetSettingsKey.dispose();
              if (registry.isNotFoundError(err3)) {
                continue;
              } else {
                throw err3;
              }
            }
          } else {
            internetSettingsKey.dispose();
          }
        } catch (err2) {
          if (registry.isNotFoundError(err2)) {
            continue;
          } else {
            throw err2;
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      `cannot initialize network stack for proxy from internet settings: ${
        err.message || err
      }`
    );
  }

  return false;
}

async function tryInitializeNetworkStackFromPacFile() {
  try {
    const os = require('os');
    if (os.platform() === 'win32') {
      const registry = require('node-windows-registry');

      for (let key of getInternetSettingsKeys(registry)) {
        try {
          const internetSettingsKey = await registry.openKey(key.keyName, {
            hive: key.hive,
            view: registry.x64,
          });

          let autoConfigURL = '';

          try {
            autoConfigURL = await internetSettingsKey.getValue('AutoConfigURL');
          } catch (err3) {
            internetSettingsKey.dispose();
            if (registry.isNotFoundError(err3)) {
              continue;
            } else {
              throw err3;
            }
          }

          if (autoConfigURL) {
            // TODO: support
            // add env variable so that above layers can maybe show a message about
            process.env['WESTEROS_PROXY_AUTOCONFIG_URL'] = autoConfigURL;
            console.warn(
              `proxy autoconfig file at path ${autoConfigURL} has been detected but is currently unsupported`
            );
          }
          internetSettingsKey.dispose();
          return false;
        } catch (err2) {
          if (registry.isNotFoundError(err2)) {
            continue;
          } else {
            throw err2;
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      `cannot initialize network stack for proxy from pac file: ${
        err.message || err
      }`
    );
  }

  return false;
}

async function tryDetectProxy() {
  try {
    tryInitializeNetworkStackFromEnvironment() ||
      (await tryInitializeNetworkStackFromInternetSettings()) ||
      (await tryInitializeNetworkStackFromPacFile());
  } catch (err) {
    console.warn(
      `cannot initialize network stack for proxy: ${err.message || err}`
    );
  }
}

module.exports = {
  hasProxyBeenDetected: () => {
    return proxyBeenDetected;
  },
  tryDetectProxy,
};
