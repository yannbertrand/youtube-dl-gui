import Storage from '../storage/storage';

const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const url = require('url');
const EventEmitter = require('events');

export var init = function () { };

export default DownloaderFactory;

const DownloaderFactory = (() => {

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
        downloader.on('status/update', this.addVideoInDownloadsIfNecessary);
        downloader.pause();
        downloader.checkStatus();

        this.downloaders.set(id, downloader);
      }

      return this.downloaders;
    }

    has(id) {
      return this.downloaders.has(id);
    }

    get(id) {
      return this.downloaders.get(id);
    }

    start(id, onInfo, onProgress, onError, onEnd) {
      if (this.downloaders.has(id)) {
        return onError('Already downloading');
      }

      const downloader = new Downloader(id);
      downloader.on('status/update', this.addVideoInDownloadsIfNecessary);
      downloader.start(onInfo, onProgress, onError, onEnd);

      this.downloaders.set(id, downloader);

      return downloader;
    }

    addVideoInDownloadsIfNecessary(newStatus) {
      if (newStatus !== Downloader.STATUSES.DOWNLOADING) {
        return;
      }

      if (Storage.hasVideoInDownloads(this.downloader.video.id)) {
        return;
      }

      Storage.addVideoInDownloads(this.downloader.video.id, this.downloader.video);
    }

    getIdFromLink(link) {
      return url.parse(link, true).query.v;
    }

    getLinkFromId(id) {
      return 'https://www.youtube.com/watch?v=' + id;
    }

  }

  return new DownloaderFactory();

})();

export { Downloader };

class Downloader extends EventEmitter {

  constructor(videoOrId, baseDestination = Storage.getBaseDestination(), proxy = Storage.getProxy()) {
    super();

    this.download = null;
    this.proxy = proxy;
    this.downloaded = 0;

    if (typeof videoOrId === 'string') {
      this.video = {
        id: videoOrId,
        baseDestination: baseDestination,
      };
    } else {
      this.video = videoOrId;
    }

    this.status = Downloader.STATUSES.INIT;
    this.progress = this.getProgress();
  }

  static get STATUSES() {
    return {
      INIT: 'init',
      WAITING: 'waiting',
      DOWNLOADING: 'downloading',
      PAUSED: 'paused',
      ERROR: 'error',
      DONE: 'done',
    }
  }

  updateStatus(newStatus) {
    this.emit('status/update', { status: newStatus });
    this.status = newStatus;
  }

  refreshStatus() {
    this.updateStatus(this.status);
  }

  checkStatus() {
    if (this.progress === 100) {
      this.updateStatus(Downloader.STATUSES.DONE);
    }
  }

  getProgress() {
    if (typeof this.video.filePath === 'undefined') { return 0.0; }

    const fileSize = fs.statSync(this.video.filePath).size;
    return (fileSize / this.video.size) * 100.0;
  }

  start(onInfo, onProgress, onError, onEnd, customOnInfo = this.onStartInfo) {
    this.updateStatus(Downloader.STATUSES.WAITING);

    mkdirp(this.video.baseDestination, () => {
      this.download = youtubedl(
        DownloaderFactory.getLinkFromId(this.video.id),
        this.getDownloadOptions(),
        { start: this.downloaded, cwd: this.video.baseDestination }
      );

      this.download.on('info', (info) => this.onInfo(info, onInfo));
      this.download.on('data', (chunk) => this.onProgress(chunk, onProgress));
      this.download.on('error', (error) => this.onError(error, onError));
      this.download.on('end', () => this.onEnd(onEnd));
    });
  }

  resume(onInfo, onProgress, onError, onEnd) {
    try {
      this.downloaded = fs.statSync(this.video.filePath).size;
    } catch (error) {
      return onError(error);
    }

    this.start(onInfo, onProgress, onError, onEnd, this.onResumeInfo);
  }

  onInfo(info, onInfo) {
    this.filterVideoInfoToStore(info, (video) => {
      this.video = video;

      this.download.pipe(fs.createWriteStream(this.video.filePath, { flags: 'a' }));

      this.updateStatus(Downloader.STATUSES.DOWNLOADING);

      onInfo();
    });
  }

  onProgress(chunk, onProgress) {
    this.downloaded += chunk.length;

    if (this.video.size > 0) {
      onProgress((this.downloaded / this.video.size) * 100);
    }
  }

  onError(error, onError) {
    this.updateStatus(Downloader.STATUSES.ERROR);
    onError(error);
  }

  onEnd(onEnd) {
    this.updateStatus(Downloader.STATUSES.DONE);
    onEnd();
  }

  pause() {
    if (this.download !== null) { this.download.pause(); }

    this.updateStatus(Downloader.STATUSES.PAUSED);
  }

  filterVideoInfoToStore(info, callback) {
    const video = {
      id: this.video.id,
      title: info.title,
      uploader: info.uploader,
      duration: info.duration,
      size: this.video.size || info.size,
      formatId: info.format_id,
      uploadDate: info.upload_date,
      baseDestination: this.video.baseDestination,
      filePath: this.video.filePath,
      launchedAt: new Date(),
    };

    if (typeof video.filePath === 'undefined') {
      return this.getFilePath(info, (filePath) => {
        video.filePath = filePath;
        return callback(video);
      });
    }

    callback(video);
  }

  getDownloadOptions() {
    const options = ['--format=18'];

    if(this.proxy !== null) {
      options.push('--proxy=' + this.proxy);
    }

    return options;
  }

  getFilePath(video, callback) {
    this.getDestination(video, (destination) => {
      if (video.playlist_index === null || video.playlist_index === 'NA') {
        return callback(path.join(destination, video._filename));
      }

      callback(path.join(destination, video.playlist_index + ' - ' + video._filename));
    });
  }

  getDestination(video, callback) {
    let destination = path.join(this.video.baseDestination, video.uploader);

    const isVideoInPlaylist = video.playlist !== null && video.playlist !== 'NA';
    if (isVideoInPlaylist) {
      destination = path.join(destination, video.playlist);
    }

    mkdirp(destination, () => callback(destination));
  }

};
