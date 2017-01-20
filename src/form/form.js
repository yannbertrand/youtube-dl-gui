import { downloadVideo } from '../downloader/downloader';
const prettyBytes = require('pretty-bytes');
const { shell } = require('electron');

const STATUS = {
    DOWNLOADING: 'Downloading...',
    PAUSED: 'Paused',
    STOPPED: 'Stopped',
    ERROR: 'Error',
    DONE: 'Done',
};


const videos = [];

export var init = function () {
    const $body = $('body');
    const $form = $body.find('form');
    const $table = $body.find('table');
    const $tableParent = $table.parent();
    const $inputGroup = $form.find('.input-group');
    const $input = $inputGroup.find('input');
    const $submit = $form.find('button');
    const $icon = $submit.find('span');

    $tableParent.hide();

    const $datatable = $table.DataTable({
        info: false,
        paging: false,
        scrollCollapse: true,
        scrollY: '10vw',
    });

    $('.dataTables_scrollBody').css('max-height', 200);

    $input.on('input', function () {
        if ($inputGroup.hasClass('has-danger')) {
            $inputGroup.removeClass('has-danger');
        }
    });

    $form.on('submit', function (event) {
        $icon.addClass('fa-spin');
        $submit.prop('disabled', true);

        downloadVideoAndAddRowToTable($input.val(), $datatable, function (error) {
            if (error) {
                console.log(error);
                $inputGroup.addClass('has-danger');
            } else {
                $input.val('');
            }

            $input.focus();
            $icon.removeClass('fa-spin');
            $submit.prop('disabled', false);
            $body.removeClass('center-vertical');
            $tableParent.show();
        });

        event.preventDefault();
    });
};

function downloadVideoAndAddRowToTable(link, $datatable, callback) {
    let info;
    let $tr;

    downloadVideo(link, onInfo, callback, onEnd);

    function onInfo(_info) {
      info = _info;
      $tr = $(videoToHTML(info));

      $datatable.row.add($tr).draw(false);

      callback();
    }

    function onEnd() {
      videoEnd($tr, info);
      console.log('finished downloading!');
    }
}

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

function videoEnd($tr, info) {
    $tr.find('td.status').text(STATUS.DONE);

    const $button = $('<button title="Open the folder containing this file" class="btn btn-secondary btn-sm">' +
        '<span class="fa fa-folder-open"></span>' +
    '</button>').on('click', () => shell.showItemInFolder(path.join(DESTINATION_FOLDER, info._filename)));
    $tr.find('td.actions').html($button);
}
