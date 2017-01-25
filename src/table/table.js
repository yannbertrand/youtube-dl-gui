import { downloadVideo } from '../downloader/downloader';

const path = require('path');
const prettyBytes = require('pretty-bytes');
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
};

export var downloadVideoAndAddRowToTable = function (link, onError, onVideoAddedToTable) {
  let $tr;

  downloadVideo(link, onStartDownloading, onProgress, onError, onEnd);

  function onStartDownloading(info) {
    $tr = $(videoToHTML(info));

    $datatable.row.add($tr).draw(false);
    $tableParent.show();

    onVideoAddedToTable();
  }

  function onProgress(percentage) {
    $tr.find('td.status').text(Math.round(percentage) + '%');
    moveProgressIndicator($tr, percentage);
  }

  function onEnd(destinationFilePath) {
    $tr.addClass('done');

    const $button = getShowItemInFolderButton(destinationFilePath);
    $tr.find('td.actions').html($button);
  }
};

function videoToHTML(video, percentage = 0) {
    const trClass = (percentage > 0) ? 'paused' : '';
    let actions = (percentage > 0) ? getContinueButton() : '';
    actions += getCancelAndDeleteButton();

    return '<tr class="' + trClass + '">' +
            '<td class="col-md-5 col-xs-2">' + video.title + '</td>' +
            '<td class="col-md-3 col-xs-2">' + video.uploader + '</td>' +
            '<td class="col-md-1 col-xs-2 right">' + video.duration + '</td>' +
            '<td class="col-md-1 col-xs-2 right">' + prettyBytes(video.size) + '</td>' +
            '<td class="col-md-1 col-xs-2 status right">' + Math.round(percentage) + '%</td>' +
            '<td class="col-md-1 col-xs-2 actions">' + actions + '</td>' +
        '</tr>';
}

function getContinueButton() {
    return '<button title="Continue download" class="btn btn-primary btn-sm" disabled>' +
                '<span class="fa fa-play"></span>' +
            '</button>';
}

function getCancelAndDeleteButton() {
    return '<button title="(Cancel the download and) delete this file" class="btn btn-danger btn-sm" disabled>' +
                '<span class="fa fa-trash"></span>' +
            '</button>';
}

function getShowItemInFolderButton(destinationFilePath) {
    return $('<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
          '<span class="fa fa-folder-open"></span>' +
      '</button>').on('click', () => shell.showItemInFolder(destinationFilePath))
}

function moveProgressIndicator($tr, percentage) {
  $tr.css('background-size', percentage + '% 1px');
}
