import DownloadsManager, { Downloader } from '../downloader/downloader';
import Storage from '../storage/storage';

const path = require('path');
const prettyBytes = require('pretty-bytes');
const url = require('url');
const { shell } = require('electron');

export default DownloadsTable;

class DownloadsTable {

  constructor() {
    this.$table = $('table');
    this.$tableParent = this.$table.parent();
    this.$tableParent.hide();

    this.$datatable = this.$table.DataTable({
      info: false,
      paging: false,
      autoWidth: false,
    });

    this.rows = new Map();

    this.initDataFromStorage();
  }

  initDataFromStorage() {
    const downloaders = DownloadsManager.initDownloadersFromStorage();
    if (downloaders.size === 0) {
      return;
    }

    $('body').removeClass('center-vertical');

    this.addStoredVideos(downloaders);

    this.$tableParent.show();
  }

  addStoredVideos(downloaders) {
    for (const [id, downloader] of downloaders.entries()) {
      const downloadRow = this.createRow(id, downloader);
      this.$datatable.row.add(downloadRow.$tr).draw(false);
    }
  }

  downloadVideo(link, onSuccess, onFail) {
    const id = DownloadsManager.getIdFromLink(link);

    if (this.rows.has(id)) {
      const downloadRow = this.rows.get(id);

      return downloadRow.resume(onSuccess, onFail);
    }

    const downloadRow = this.createRow(id);
    downloadRow.download(() => this.onStartDownloading(downloadRow, onSuccess), onFail);
  }

  createRow(id, downloader) {
    const downloadRow = new DownloadRow(id, downloader);

    this.rows.set(id, downloadRow);

    return downloadRow;
  }

  onStartDownloading(downloadRow, onSuccess) {
    this.$datatable.row.add(downloadRow.$tr).draw(false);
    this.$tableParent.show();
    onSuccess();
  }

}

class DownloadRow {

  constructor(id, downloader = null) {
    this.id = id;
    this.downloader = downloader;

    if (downloader === null) {
      return;
    }

    const percentage = downloader.getProgress();

    this.createRow(percentage);
    this.moveProgressIndicator(percentage);
  }

  download(onSuccess, onFail) {
    this.downloader = DownloadsManager.start(
      this.id,
      () => this.onStartDownloading(onSuccess),
      this.onProgress.bind(this),
      (error) => this.onError(error, onFail),
      () => {}
    );
  }

  resume(onSuccess, onFail) {
    if (this.downloader.status === Downloader.STATUSES.DONE) {
      this.$tr.css('background-color', 'rgba(0, 255, 0, 0.2)'); // ToDo animate
      return onSuccess();
    }

    DownloadsManager.resume(
      this.id,
      onSuccess,
      this.onProgress.bind(this),
      (error) => this.onError(error, onFail),
      () => {}
    );
  }

  onStartDownloading(onSuccess) {
    this.createRow();

    onSuccess();
  }

  onProgress(percentage) {
    this.$status.text(Math.round(percentage) + '%');
    this.moveProgressIndicator(percentage);
  }

  onError(error, onFail) {
    onFail(error);
  }

  createRow(percentage = 0) {
    this.$tr = $(this.videoToHTML(percentage));
    this.$actions = this.$tr.find('td.actions');
    this.$status = this.$tr.find('td.status');

    this.downloader.on('status/update', this.updateActions.bind(this));
    this.downloader.refreshStatus();
  }

  updateActions(newStatus) {
    switch (newStatus) {
      case Downloader.STATUSES.WAITING:
        return this.disableActions();
      case Downloader.STATUSES.DOWNLOADING:
        return this.$actions.html(this.getPauseButton());
      case Downloader.STATUSES.PAUSED:
        return this.$actions.html(this.getResumeButton());
      case Downloader.STATUSES.DONE:
        return this.$actions.html(this.getShowItemInFolderButton());
      default:
        return this.$actions.html('');
    };
  }

  getResumeButton() {
    return $('<button title="Resume download" class="btn btn-primary btn-sm">' +
                '<span class="fa fa-play"></span>' +
              '</button>').on('click', () => this.resume(console.log, console.error));
  }

  getShowItemInFolderButton() {
    return $('<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
                '<span class="fa fa-folder-open"></span>' +
              '</button>').on('click', () => shell.showItemInFolder(this.downloader.video.filePath))
  }

  getPauseButton($actions, downloader) {
    return $('<button title="Pause video download" class="btn btn-secondary btn-sm">' +
                '<span class="fa fa-pause"></span>' +
              '</button>').on('click', () => {
        this.disableActions();
        DownloadsManager.pause(this.id);
    });
  }

  disableActions() {
    const $actionButton = this.$actions.find('button');
    const $actionButtonSpan = $actionButton.find('span');

    $actionButton.prop('disabled', true);
    $actionButtonSpan.addClass('fa-spin');
  }

  moveProgressIndicator(percentage) {
    if (percentage === 100) {
      this.$tr.addClass('done');
    }

    this.$tr.css('background-size', percentage + '% 1px');
  }

  videoToHTML(percentage = 0) {
    return '<tr id="' + this.downloader.video.id + '">' +
              '<td class="col-md-5 col-xs-2">' + this.downloader.video.title + '</td>' +
              '<td class="col-md-3 col-xs-2">' + this.downloader.video.uploader + '</td>' +
              '<td class="col-md-1 col-xs-2 right">' + this.downloader.video.duration + '</td>' +
              '<td class="col-md-1 col-xs-2 right">' + prettyBytes(this.downloader.video.size) + '</td>' +
              '<td class="col-md-1 col-xs-2 status right">' + Math.round(percentage) + '%</td>' +
              '<td class="col-md-1 col-xs-2 actions"></td>' +
          '</tr>';
  }

}
