const { remote } = require('electron');
const path       = require('path');
const Config     = require('electron-config');

const DEFAULT_BASE_DESTINATION = path.join(remote.app.getPath('videos'), 'YouTube');

const KEYS = {
  BASE_DESTINATION: 'base_destination',
  PROXY:            'proxy'
};

let config;
export var init = function () {
  config = new Config();

  if (! config.has(KEYS.BASE_DESTINATION)) {
    config.set(KEYS.BASE_DESTINATION, DEFAULT_BASE_DESTINATION);
  }
};

export var save = function (key, value) {
  config.set(key, value);
};

export var get = function (key) {
  config.get(key);
};

// base dest setting
export var getBaseDestination = function () {
  return config.get(KEYS.BASE_DESTINATION);
}

export var setBaseDestination = function (baseDestination) {
  config.set(KEYS.BASE_DESTINATION, baseDestination);
}

// proxy setting
export var getProxy = function () {
  return config.get(KEYS.PROXY);
}

export var setProxy = function (proxy) {
  config.set(KEYS.PROXY, proxy);
}
