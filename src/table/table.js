import DownloaderFactory, { Downloader } from '../downloader/downloader';
import Storage from '../storage/storage';

const path = require('path');
const fs = require('fs');
const prettyBytes = require('pretty-bytes');
const url = require('url');
const { shell } = require('electron');

let $datatable;
let $tableParent;

export var init = function () {
  const $table = $('table');
  $tableParent = $table.parent();
  $tableParent.hide();

  $datatable = $('table').DataTable({
    info: false,
    paging: false,
    autoWidth: false,
  });

  const downloaders = DownloaderFactory.initDownloadersFromStorage();
  if (downloaders.size === 0) {
    return;
  }

  $('body').removeClass('center-vertical');

  addStoredVideosToTable(downloaders);

  $tableParent.show();
};

function addStoredVideosToTable(downloaders) {
  for (const [id, downloader] of downloaders.entries()) {
    const percentage = downloader.getProgress();

    const $tr = $(videoToHTML(downloader.video, percentage));
    moveProgressIndicator($tr, percentage);
    updateActions(id, $tr.find('td.actions'), downloader.video.path, percentage, 'https://www.youtube.com/watch?v=' + id);

    $datatable.row.add($tr).draw(false);
  }
}

export var downloadVideoAndUpdateTable = function (link, onError, onSuccess) {
  let $tr;
  let $actions;
  let filePath;

  const id = DownloaderFactory.getIdFromLink(link);
  if (DownloaderFactory.has(id)) {
    $tr = $('table').find('tr#' + id);
    $actions = $tr.find('td.actions');

    const downloader = DownloaderFactory.get(id);
    if (downloader.status === Downloader.STATUSES.DONE) {
      $tr.css('background-color', 'rgba(0, 255, 0, 0.2)'); // ToDo animate
      return onSuccess();
    }

    const $actionButton = $actions.find('button');
    const $actionButtonSpan = $actionButton.find('span');
    if ($actionButtonSpan.hasClass('fa-play')) {
      $actionButton.prop('disabled', true);
      $actionButtonSpan.addClass('fa-spin');
    }

    return downloader.resume(onSuccess, onProgress, onFail, onEnd);
  }

  const downloader = DownloaderFactory.start(id, onStartDownloading, onProgress, onFail, onEnd);

  downloader.on('status/update', function (data) {
    console.log(data);
  })

  function onStartDownloading() {
    $tr = $(videoToHTML(downloader.video));
    $actions = $tr.find('td.actions');
    filePath = downloader.path;

    $datatable.row.add($tr).draw(false);
    $tableParent.show();

    onSuccess();
  }

  function onProgress(percentage) {
    $tr.find('td.status').text(Math.round(percentage) + '%');
    moveProgressIndicator($tr, percentage);
    updateActions(id, $actions, filePath, percentage);
  }

  function onFail(error) {
    if (error === 'Already downloading') {
      return onError(error);
    }

    if ($actions) {
      // Set percentage to 1 to get a resume button
      updateActions(id, $actions, filePath, 1, 'https://www.youtube.com/watch?v=' + id);
    }

    onError(error);
  }

  function onEnd(destinationFilePath) {
    const $button = getShowItemInFolderButton(destinationFilePath);
    $tr.find('td.actions').html($button);
  }
};

function getVideoDownloadPercentage(info) {
  const fileSize = fs.statSync(info.path).size;
  return (fileSize / info.size) * 100.0;
}

function videoToHTML(video, percentage = 0) {
    return '<tr id="' + video.id + '">' +
            '<td class="col-md-5 col-xs-2">' + video.title + '</td>' +
            '<td class="col-md-3 col-xs-2">' + video.uploader + '</td>' +
            '<td class="col-md-1 col-xs-2 right">' + video.duration + '</td>' +
            '<td class="col-md-1 col-xs-2 right">' + prettyBytes(video.size) + '</td>' +
            '<td class="col-md-1 col-xs-2 status right">' + Math.round(percentage) + '%</td>' +
            '<td class="col-md-1 col-xs-2 actions"></td>' +
        '</tr>';
}

function updateActions(id, $actions, filePath, percentage, link = '') {
    if (percentage === 100) {
        return $actions.html(getShowItemInFolderButton(filePath));
    }

    if (link !== '') {
        return $actions.html(getResumeButton(link));
    }

    if ($actions.has('.fa-pause').length === 0) {
      $actions.html(getPauseButton(id, $actions, filePath, percentage));
    }
}

function getResumeButton(link) {
    return $('<button title="Resume download" class="btn btn-primary btn-sm">' +
                '<span class="fa fa-play"></span>' +
            '</button>').on('click', () => downloadVideoAndUpdateTable(link, console.log, console.log));
}

function getShowItemInFolderButton(destinationFilePath) {
    return $('<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
          '<span class="fa fa-folder-open"></span>' +
      '</button>').on('click', () => shell.showItemInFolder(destinationFilePath))
}

function getPauseButton(id, $actions, filePath, percentage) {
    return $('<button title="Pause video download" class="btn btn-secondary btn-sm">' +
          '<span class="fa fa-pause"></span>' +
      '</button>').on('click', () => {
        $actions.find('button').prop('disabled', true).find('span').addClass('fa-spin');
        pauseDownload(id, () => updateActions(id, $actions, filePath, percentage, 'https://www.youtube.com/watch?v=' + id));
      });
}

function moveProgressIndicator($tr, percentage) {
  if (percentage === 100) {
    $tr.addClass('done');
  }

  $tr.css('background-size', percentage + '% 1px');
}
