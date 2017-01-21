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
  });

  $('.dataTables_scrollBody').css('max-height', 200);
};

export var downloadVideoAndAddRowToTable = function (link, onError, onVideoAddedToTable) {
  let $tr;
  let $status;

  downloadVideo(link, onStartDownloading, onProgress, onError, onEnd);

  function onStartDownloading(info) {
    $tr = $(videoToHTML(info));
    $status = $tr.find('td.status');

    $datatable.row.add($tr).draw(false);
    $tableParent.show();

    onVideoAddedToTable();
  }

  function onProgress(percent) {
    $status.text(Math.round(percent) + '%');
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
            '<td class="status right">0%</td>' +
            '<td class="actions">' +
                '<button title="(Cancel the download and) delete this file" class="btn btn-danger btn-sm">' +
                    '<span class="fa fa-trash"></span>' +
                '</button>' +
            '</td>' +
        '</tr>';
}

function videoEnd($tr, destinationFilePath) {
  const $button = $('<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
      '<span class="fa fa-folder-open"></span>' +
  '</button>').on('click', () => shell.showItemInFolder(destinationFilePath));
  $tr.find('td.actions').html($button);
}
