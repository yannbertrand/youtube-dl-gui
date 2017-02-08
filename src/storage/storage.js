const { remote } = require('electron');
const path       = require('path');
const Config     = require('electron-config');

const DEFAULT_BASE_DESTINATION = path.join(remote.app.getPath('videos'), 'YouTube');

const KEYS = {
  BASE_DESTINATION: 'base_destination',
  PROXY: 'proxy',
  DOWNLOADS: 'downloads',
};

let config;
export var init = function () {
  config = new Config();

  if (! config.has(KEYS.BASE_DESTINATION)) {
    config.set(KEYS.BASE_DESTINATION, DEFAULT_BASE_DESTINATION);
  }

  if (! config.has(KEYS.DOWNLOADS)) {
    config.set(KEYS.DOWNLOADS, {});
  }
};

export default (() => {
  let instance = null;

  class Storage {

    constructor() {
      if (! instance) { instance = this; }

      return instance;
    }

    getBaseDestination() { return config.get(KEYS.BASE_DESTINATION); }
    setBaseDestination(baseDestination) { config.set(KEYS.BASE_DESTINATION, baseDestination); }

    getProxy() { return config.get(KEYS.PROXY); }
    setProxy(proxy) { config.set(KEYS.PROXY, proxy); }

    getDownloads() { return config.get(KEYS.DOWNLOADS); }
    hasVideoInDownloads(id) { return config.has(KEYS.DOWNLOADS + '.' + id); }
    getVideoInDownloads(id) { return config.get(KEYS.DOWNLOADS + '.' + id); }
    removeVideoFromDownloads(id) { config.delete(KEYS.DOWNLOADS + '.' + id); }

    addVideoInDownloads(id, info) {
      if (this.hasVideoInDownloads(id)) {
        throw new Error('Already in list');
      }

      const downloads = config.get(KEYS.DOWNLOADS);
      downloads[id] = info;

      config.set(KEYS.DOWNLOADS, downloads);
    }

    filterVideoInfoToStore(info, filePath) {
      return {
        id: info.id,
        title: info.title,
        uploader: info.uploader,
        duration: info.duration,
        size: info.size,
        formatId: info.format_id,
        uploadedDate: info.uploaded_date,
        path: filePath,
        launchedAt: new Date(),
      };
    }
  };

  return new Storage();
})();
