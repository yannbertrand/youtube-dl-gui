import Storage from '../storage/storage';

const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { remote } = require('electron');

export var init = function () { };

const downloading = new Map();


export default (() => {

  let instance;

  class DownloaderFactory {

    constructor() {
      if (! instance) {
        instance = this;
      }

      this.downloaders = new Map();

      return this;
    }

    initDownloadersFromStorage() {
      Storage.deleteNotFoundDownloads();
      const videos = Storage.getDownloads();

      for (const id in videos) {
        const downloader = new Downloader(videos[id]);
        downloader.pause();

        this.downloaders.set(id, downloader);
      }

      return this.downloaders;
    }

  }

  return new DownloaderFactory();

})();

class Downloader {

  constructor(video) {
    this.download = null;

    this.video = video;

    this.status = Downloader.STATUSES.INIT;
    this.progress = this.getProgress();
  }

  static get STATUSES() {
    return {
      INIT: 'init',
      WAITING: 'waiting',
      DOWNLOADING: 'downloading',
      PAUSED: 'paused',
      DONE: 'done',
    }
  }

  getProgress() {
    if (this.video.path === null) { return 0.0; }

    const fileSize = fs.statSync(this.video.path).size;
    return (fileSize / this.video.size) * 100.0;
  }

  pause() {
    if (this.download !== null) { download.pause(); }

    if (this.progress < 100) {
      this.status = Downloader.STATUSES.PAUSED;
    } else {
      this.status = Downloader.STATUSES.DONE;
    }
  }

};

export var downloadVideo = function (link, onInfo, onProgress, onError, onEnd, filePath = '') {
  const id = url.parse(link, true).query.v;
  if (downloading.has(id)) {
    return onError('Already downloading');
  }

  const resuming = filePath !== '';

  let downloaded = 0;
  let total = 0;
  if (resuming && fs.existsSync(filePath)) {
    downloaded = fs.statSync(filePath).size;
  }

  const baseDestination = Storage.getBaseDestination();
  if (! fs.existsSync(baseDestination)) {
    fs.mkdirSync(baseDestination);
  }

  const video = youtubedl(
    link,
    getOptions(),
    { start: downloaded, cwd: baseDestination }
  );

  downloading.set(id, video);

  let size = 0;
  video.on('info', function (info) {
    size = info.size;
    total = size;
    if (resuming) {
      console.log('Resuming download ' + id);
      total += downloaded;
    } else {
      console.log('Beginning download ' + id);

      const destination = getDestination(baseDestination, info);
      if (! fs.existsSync(destination)) {
        fs.mkdirSync(destination);
      }

      filePath = getFilePath(destination, info);
    }

    onInfo(info, filePath);
    video.pipe(fs.createWriteStream(filePath, { flags: 'a' }));

    if (! resuming) {
      Storage.addVideoInDownloads(info.id, Storage.filterVideoInfoToStore(info, filePath));
    }
  });

  video.on('data', function (chunk) {
    downloaded += chunk.length;

    if (size > 0) {
      onProgress((downloaded / total) * 100);
    }
  });

  video.on('error', (error) => {
    downloading.delete(id);
    onError(error);
  });
  video.on('end', () => {
    console.log('finished downloading!');
    downloading.delete(id);
    onEnd(filePath);
  });
};

export var pauseDownload = function (id, callback) {
  console.log('Pause download ' + id);

  downloading.get(id).pause();
  downloading.delete(id);

  callback();
};

function getOptions() {
  const options = ['--format=18'];

  const proxy = Storage.getProxy();
  if(typeof proxy !== 'undefined') {
    options.push('--proxy=' + proxy);
  }

  return options;
}

function getDestination(baseDestination, info) {
  if (info.playlist === null || info.playlist === 'NA') {
    return path.join(baseDestination, info.uploader);
  }

  return path.join(baseDestination, info.uploader, info.playlist);
}

function getFilePath(destination, info) {
  if (info.playlist_index === null || info.playlist_index === 'NA') {
    return path.join(destination, info._filename);
  }

  return path.join(destination, info.playlist_index + ' - ' + info._filename);
}
