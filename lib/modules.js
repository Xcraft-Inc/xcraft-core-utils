'use strict';

const path = require('path');
const fse = require('fs-extra');
const xFs = require('xcraft-core-fs');
const _ = require('lodash');

function merge(obj, overloads) {
  _.mergeWith(obj, overloads, (_, src) =>
    Array.isArray(src) && src.length === 0 ? [] : undefined
  );
}

function applyOverloads(appDir, appId, variantId, app) {
  if (!variantId) {
    return;
  }

  try {
    const overloads = JSON.parse(
      fse.readFileSync(path.join(appDir, appId, `app.${variantId}.json`))
    );
    merge(app.xcraft, overloads);
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
  }
}

exports.mergeOverloads = merge;

exports.extractForEtc = (appDir, appId, variantId) => {
  const app = JSON.parse(
    fse.readFileSync(path.join(appDir, appId, 'app.json'))
  );
  applyOverloads(appDir, appId, variantId, app);

  Object.keys(app.xcraft)
    .filter((key) => key.includes('@'))
    .map((key) => {
      const arr = key.split('@');
      return {
        moduleName: arr[0],
        fullAppId: arr[1],
        appIds: arr[1].split('+'),
      };
    })
    .forEach((mod) => {
      const userOverloads = app.xcraft[`${mod.moduleName}@${mod.fullAppId}`];
      app.xcraft[mod.moduleName] = {};

      mod.appIds.forEach((appId) => {
        const appConfig = JSON.parse(
          fse.readFileSync(path.join(appDir, appId, 'app.json'))
        );
        applyOverloads(appDir, appId, variantId, appConfig);
        merge(app.xcraft[mod.moduleName], appConfig.xcraft[mod.moduleName]);
      });

      merge(app.xcraft[mod.moduleName], userOverloads);
      delete app.xcraft[`${mod.moduleName}@${mod.fullAppId}`];
    });

  return app.xcraft;
};

exports.loadAppConfig = (appId, appDir, configJson = {}, variantId = null) => {
  if (configJson[appId]) {
    return;
  }

  configJson[appId] = exports.extractForEtc(appDir, appId, variantId);
  const hordesCfg = configJson[appId]['xcraft-core-horde'];

  if (hordesCfg && hordesCfg.hordes) {
    hordesCfg.hordes
      .filter(
        (appId) =>
          !hordesCfg.topology ||
          (hordesCfg.topology && !hordesCfg.topology[appId])
      )
      .forEach((appId) =>
        exports.loadAppConfig(appId, appDir, configJson, variantId)
      );
  }

  return configJson;
};

exports.extractConfigDeps = (libDir, configJson) => {
  const deps = {};

  Object.keys(configJson).forEach((appId) => {
    const appCfg = configJson[appId];
    if (appCfg['xcraft-core-horde']) {
      deps['xcraft-core-horde'] = true;
    }

    const serverCfg = appCfg['xcraft-core-server'];
    if (!serverCfg || !serverCfg.modules) {
      return;
    }

    serverCfg.modules.forEach((mod) => {
      deps[mod] = true;
    });
  });

  if (!Object.keys(deps).length) {
    xFs
      .lsdir(libDir)
      .filter((dir) => !/^xcraft-dev-.*/.test(dir))
      .forEach((dep) => {
        deps[dep] = true;
      });
  }

  return deps;
};

exports.extractAllDeps = (appId, libDir, configJson) => {
  const newDeps = exports.extractConfigDeps(libDir, configJson);

  const filters = [/^xcraft-(core|contrib)-/];
  const serverCfg = configJson[appId]['xcraft-core-server'];
  if (serverCfg) {
    if (serverCfg.userModulesFilter) {
      filters.push(new RegExp(serverCfg.userModulesFilter));
    }
  }

  const extract = (deps) => {
    let newDep = false;

    Object.keys(deps)
      .map((dep) => {
        const def = JSON.parse(
          fse.readFileSync(path.join(libDir, dep, 'package.json'))
        );
        return def.dependencies ? Object.keys(def.dependencies) : [];
      })
      .forEach((_deps) =>
        _deps
          .filter(
            (dep) =>
              !newDeps.hasOwnProperty(dep) &&
              filters.some((filter) => filter.test(dep))
          )
          .forEach((dep) => {
            newDep = true;
            newDeps[dep] = dep;
          })
      );

    if (newDep) {
      extract(newDeps);
    }
  };

  extract(newDeps);
  return Object.keys(newDeps);
};

exports.extractAllJs = (libDir, modules) => {
  let list = [];

  modules.forEach((mod) => {
    const location = path.join(libDir, mod);
    const files = xFs
      .lsall(location, true)
      .filter((file) => {
        const relativePath = file.substring(location.length + 1);
        const items = relativePath.split(path.sep);
        if (items.includes('node_modules')) {
          return false;
        }
        if (items[0] === 'test' || items[0] === 'species') {
          return false;
        }
        return true;
      })
      .filter((file) => /\.js$/.test(file));
    list = list.concat(files);
  });

  return list;
};
