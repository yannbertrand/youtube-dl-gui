import { downloadVideo } from '../downloader/downloader';

const path = require('path');
const prettyBytes = require('pretty-bytes');
const { shell } = require('electron');

const STATUS = {
  DOWNLOADING: 'Downloading...',
  PAUSED: 'Paused',
  STOPPED: 'Stopped',
  ERROR: 'Error',
  DONE: 'Done',
};

let $datatable;
let $tableParent;

export var init = function () {
  const $table = $('table');

  $tableParent = $table.parent();
  $tableParent.hide();

  $datatable = $('table').DataTable({
    info: false,
    paging: false,
    scrollCollapse: true,
    scrollY: '10vw',
  });

  $('.dataTables_scrollBody').css('max-height', 200);
};

export var downloadVideoAndAddRowToTable = function (link, onError, onVideoAddedToTable) {
  let $tr;

  downloadVideo(link, onStartDownloading, onError, onEnd);

  function onStartDownloading(info) {
    $tr = $(videoToHTML(info));

    $datatable.row.add($tr).draw(false);
    $tableParent.show();

    onVideoAddedToTable();
  }

  function onEnd(destinationFilePath) {
    videoEnd($tr, destinationFilePath);
  }
};

function videoToHTML(video) {
    return '<tr>' +
            '<td>' + video.title + '</td>' +
            '<td>' + video.uploader + '</td>' +
            '<td class="right">' + video.duration + '</td>' +
            '<td class="right">' + prettyBytes(video.size) + '</td>' +
            '<td class="status">' + STATUS.DOWNLOADING + '</td>' +
            '<td class="actions">' +
                '<button title="(Cancel the download and) delete this file" class="btn btn-danger btn-sm">' +
                    '<span class="fa fa-trash"></span>' +
                '</button>' +
            '</td>' +
        '</tr>';
}

function videoEnd($tr, destinationFilePath) {
  $tr.find('td.status').text(STATUS.DONE);

  const $button = $('<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
      '<span class="fa fa-folder-open"></span>' +
  '</button>').on('click', () => shell.showItemInFolder(destinationFilePath));
  $tr.find('td.actions').html($button);
}
