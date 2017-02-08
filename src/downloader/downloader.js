import Storage from '../storage/storage';

const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const url = require('url');
const EventEmitter = require('events');
const { remote } = require('electron');

export var init = function () { };

const downloading = new Map();


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
        downloader.pause();

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
      downloader.start(onInfo, onProgress, onError, onEnd);

      this.downloaders.set(id, downloader);

      return downloader;
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

  constructor(videoOrId) {
    super();

    this.download = null;
    this.downloaded = 0;
    this.total = 0;

    if (typeof videoOrId === 'string') {
      this.video = { id: videoOrId };
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
    this.emit('status/update', { oldStatus: this.status, newStatus: newStatus });
    this.status = newStatus;
  }

  getProgress() {
    if (typeof this.video.path === 'undefined') { return 0.0; }

    const fileSize = fs.statSync(this.video.path).size;
    return (fileSize / this.video.size) * 100.0;
  }

  start(onInfo, onProgress, onError, onEnd, customOnInfo = this.onStartInfo) {
    this.download = youtubedl(
      DownloaderFactory.getLinkFromId(this.video.id),
      this.getDownloadOptions(),
      { start: this.downloaded, cwd: this.getBaseDestination() }
    );

    this.updateStatus(Downloader.STATUSES.WAITING);

    this.download.on('info', (info) => customOnInfo.call(this, info, onInfo));
    this.download.on('data', (chunk) => this.onProgress(chunk, onProgress));
    this.download.on('error', (error) => this.onError(error, onError));
    this.download.on('end', () => this.onEnd(onEnd));
  }

  onStartInfo(info, onInfo) {
    console.log('Beginning download ' + this.video.id);

    this.total = info.size;
    this.video = this.filterVideoInfoToStore(info, this.getFilePath(info));

    this.download.pipe(fs.createWriteStream(this.video.path, { flags: 'a' }));
    Storage.addVideoInDownloads(this.video.id, this.video);

    this.updateStatus(Downloader.STATUSES.WAITING);

    onInfo();
  }

  resume(onInfo, onProgress, onError, onEnd) {
    try {
      this.downloaded = fs.statSync(this.video.path).size;
    } catch (error) {
      return onError(error);
    }

    this.start(onInfo, onProgress, onError, onEnd, this.onResumeInfo);
  }

  onResumeInfo(info, onInfo) {
    console.log('Resuming download ' + this.video.id);

    this.total = info.size + this.downloaded;
    this.video = this.filterVideoInfoToStore(info);

    this.download.pipe(fs.createWriteStream(this.video.path, { flags: 'a' }));

    this.updateStatus(Downloader.STATUSES.DOWNLOADING);

    onInfo();
  }

  onProgress(chunk, onProgress) {
    this.downloaded += chunk.length;

    if (this.video.size > 0) {
      onProgress((this.downloaded / this.total) * 100);
    }
  }

  onError(error, onError) {
    this.updateStatus(Downloader.STATUSES.ERROR);
    onError(error);
  }

  onEnd(onEnd) {
    console.log('finished downloading!');
    this.updateStatus(Downloader.STATUSES.DONE);
    onEnd();
  }

  pause() {
    if (this.download !== null) { download.pause(); }

    if (this.progress < 100) {
      this.updateStatus(Downloader.STATUSES.PAUSED);
    } else {
      this.updateStatus(Downloader.STATUSES.DONE);
    }
  }

  filterVideoInfoToStore(info, filePath = '') {
    return {
      id: this.video.id,
      title: info.title,
      uploader: info.uploader,
      duration: info.duration,
      size: this.video.size || info.size,
      formatId: info.format_id,
      uploadedDate: info.uploaded_date,
      path: this.video.path || filePath,
      launchedAt: new Date(),
    };
  }

  getDownloadOptions() {
    const options = ['--format=18'];

    const proxy = Storage.getProxy();
    if(typeof proxy !== 'undefined') {
      options.push('--proxy=' + proxy);
    }

    return options;
  }

  getBaseDestination() {
    const baseDestination = Storage.getBaseDestination();
    if (! fs.existsSync(baseDestination)) {
      fs.mkdirSync(baseDestination);
    }

    return baseDestination;
  }

  getDestination(video) {
    const destination = this.getCompleteDestination(this.getBaseDestination(), video);
    if (! fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }

    return destination;
  }

  getCompleteDestination(baseDestination, info) {
    if (info.playlist === null || info.playlist === 'NA') {
      return path.join(baseDestination, info.uploader);
    }

    return path.join(baseDestination, info.uploader, info.playlist);
  }

  getFilePath(video) {
    const destination = this.getDestination(video);
    if (video.playlist_index === null || video.playlist_index === 'NA') {
      return path.join(destination, video._filename);
    }

    return path.join(destination, video.playlist_index + ' - ' + video._filename);
  }

};
