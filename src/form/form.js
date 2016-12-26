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
    const video = getVideoInfo(link);
    const $tr = $(videoToHTML(video));

    $table.append($tr);
    $table.show();

    callback();
}

function videoToHTML(video) {
    return '<tr>' +
            '<td>' + video.name + '</td>' +
            '<td>' + video.channel + '</td>' +
            '<td class="right">' + video.duration + '</td>' +
            '<td class="right">' + video.size + '</td>' +
            '<td>' + video.status + '</td>' +
        '</tr>';
}

function getVideoInfo(link) {
    return {
        name: 'Hello',
        channel: 'World',
        duration: '00:00',
        size: '10MB',
        status: 'Downloading...',
    };
}
