const youtubedl = require('youtube-dl');
const prettyBytes = require('pretty-bytes');
const { remote } = require('electron');
const path = require('path');
const fs = require('fs');

const STATUS = {
    DOWNLOADING: 'Downloading...',
    PAUSED: 'Paused',
    STOPPED: 'Stopped',
    ERROR: 'Error',
    DONE: 'Done',
};

const DESTINATION_FOLDER = path.join(remote.app.getPath('videos'), 'YouTube');

if (! fs.existsSync(DESTINATION_FOLDER)) {
  fs.mkdirSync(DESTINATION_FOLDER);
}

const videos = [];

export var init = function () {
    const $body = $('body');
    const $form = $body.find('form');
    const $table = $body.find('table');
    const $inputGroup = $form.find('.input-group');
    const $input = $inputGroup.find('input');
    const $submit = $form.find('button');
    const $icon = $submit.find('span');

    $table.hide();

    $input.on('input', function () {
        if ($inputGroup.hasClass('has-danger')) {
            $inputGroup.removeClass('has-danger');
        }
    });

    $form.on('submit', function (event) {
        $body.removeClass('center-vertical');
        $icon.addClass('fa-spin');
        $submit.prop('disabled', true);

        downloadVideoAndAddRowToTable($input.val(), function (error) {
            if (error) {
                console.log(error);
                $inputGroup.addClass('has-danger');
            } else {
                $input.val('');
            }

            $input.focus();
            $icon.removeClass('fa-spin');
            $submit.prop('disabled', false);
        });

        event.preventDefault();
    });
};

function downloadVideoAndAddRowToTable(link, callback) {
    const $table = $('table');

    let $datatable;
    if ($.fn.dataTable.isDataTable('table')) {
        $datatable = $table.DataTable();
    } else {
        $datatable = $table.DataTable({
            info: false,
            paging: false,
            scrollCollapse: true,
            scrollY: '10vw',
        });

        $('.dataTables_scrollBody').css('max-height', 200);
    }

    console.log(DESTINATION_FOLDER);

    const video = youtubedl(link,
      // Optional arguments passed to youtube-dl.
      ['--format=18'],
      // Additional options can be given for calling `child_process.execFile()`.
      { cwd: DESTINATION_FOLDER });

    // Will be called when the download starts.
    video.on('info', function(info) {
      video.pipe(fs.createWriteStream(path.join(DESTINATION_FOLDER, info._filename)));
      console.log(info);
      const $tr = $(videoToHTML(info));

      $datatable.row.add($tr).draw(false);
      $table.show();

      callback();
    });

    video.on('error', callback);

    // Will be called if download was already completed and there is nothing more to download.
    video.on('complete', function complete(info) {
      console.log('filename: ' + info._filename + ' already downloaded.');
    });

    video.on('end', function() {
      console.log('finished downloading!');
    });
}

function videoToHTML(video) {
    return '<tr>' +
            '<td>' + video.title + '</td>' +
            '<td>' + video.uploader + '</td>' +
            '<td class="right">' + video.duration + '</td>' +
            '<td class="right">' + prettyBytes(video.size) + '</td>' +
            '<td>' + STATUS.DOWNLOADING + '</td>' +
            '<td>' +
                '<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
                    '<span class="fa fa-folder-open"></span>' +
                '</button>' +
                '<button title="(Cancel the download and) delete this file" class="btn btn-danger btn-sm">' +
                    '<span class="fa fa-trash"></span>' +
                '</button>' +
            '</td>' +
        '</tr>';
}
