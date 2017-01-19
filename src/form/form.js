const youtubedl = require('youtube-dl');

const videos = [];

export var init = function () {
    const $body = $('body');
    const $form = $body.find('form');
    const $table = $body.find('table');
    const $input = $form.find('input');
    const $submit = $form.find('button');
    const $icon = $submit.find('span');

    $table.hide();

    $form.on('submit', function (event) {
        $body.removeClass('center-vertical');
        $icon.addClass('fa-spin');
        $submit.prop('disabled', true);

        downloadVideoAndAddRowToTable($input.val(), function (error) {
            if (!error) {
                $input.val('').focus();
            }

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

    youtubedl.getInfo(link, [], function (error, video) {
        console.log(error, video);
        const $tr = $(videoToHTML(video));

        $datatable.row.add($tr).draw(false);
        $table.show();

        callback();
    });
}

function videoToHTML(video) {
    return '<tr>' +
            '<td>' + video.title + '</td>' +
            '<td>' + video.uploader + '</td>' +
            '<td class="right">' + video.duration + '</td>' +
            '<td class="right">' + video.filesize + '</td>' +
            '<td>' + video.status + '</td>' +
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
