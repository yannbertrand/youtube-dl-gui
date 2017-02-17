const { remote } = require('electron');
const path       = require('path');
const fs         = require('fs');
const Config     = require('electron-config');

const DEFAULT_BASE_DESTINATION = path.join(remote.app.getPath('videos'), 'YouTube');

const KEYS = {
  BASE_DESTINATION: 'base_destination',
  PROXY: 'proxy',
  DOWNLOADS: 'downloads',
};

export default (() => {
  let instance = null;

  class Storage {

    constructor() {
      if (! instance) { instance = this; }

      this.config = new Config();

      if (! this.config.has(KEYS.BASE_DESTINATION)) {
        this.config.set(KEYS.BASE_DESTINATION, DEFAULT_BASE_DESTINATION);
      }

      if (! this.config.has(KEYS.DOWNLOADS)) {
        this.config.set(KEYS.DOWNLOADS, {});
      }

      return instance;
    }

    clear() { this.config.clear(); }

    getBaseDestination() { return this.config.get(KEYS.BASE_DESTINATION); }
    setBaseDestination(baseDestination) { this.config.set(KEYS.BASE_DESTINATION, baseDestination); }

    getProxy() { return this.config.get(KEYS.PROXY); }
    setProxy(proxy) { this.config.set(KEYS.PROXY, proxy); }

    getDownloads() { return this.config.get(KEYS.DOWNLOADS); }
    hasVideoInDownloads(id) { return this.config.has(KEYS.DOWNLOADS + '.' + id); }
    getVideoInDownloads(id) { return this.config.get(KEYS.DOWNLOADS + '.' + id); }
    removeVideoFromDownloads(id) { this.config.delete(KEYS.DOWNLOADS + '.' + id); }

    deleteNotFoundDownloads() {
      const downloads = this.getDownloads();
      for (const id in downloads) {
        const info = downloads[id];
        try {
          fs.statSync(info.path);
        } catch (error) {
          this.removeVideoFromDownloads(id);
        }
      }
    }

    addVideoInDownloads(id, info) {
      if (this.hasVideoInDownloads(id)) {
        throw new Error('Already in list');
      }

      const downloads = this.config.get(KEYS.DOWNLOADS);
      downloads[id] = info;

      this.config.set(KEYS.DOWNLOADS, downloads);
    }
  };

  return new Storage();
})();
