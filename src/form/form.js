import { downloadVideoAndUpdateTable } from '../table/table';

const isYouTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;

export var init = function () {
    const $body = $('body');
    const $form = $body.find('form');
    const $inputGroup = $form.find('.input-group');
    const $input = $inputGroup.find('input');
    const $submit = $form.find('button');
    const $icon = $submit.find('span');

    $input.on('input', function () {
        if ($inputGroup.hasClass('has-error')) {
            $inputGroup.removeClass('has-error');
        }
    });

    $form.on('submit', function (event) {
        event.preventDefault();

        const link = $input.val();
        if (! isYouTubeRegex.test(link)) {
            return onError('Not a YouTube link');
        }

        $icon.addClass('fa-spin');
        $submit.prop('disabled', true);

        downloadVideoAndUpdateTable(link, onError, onSuccess);

        function onError(error) {
            console.log(error);
            $inputGroup.addClass('has-error');
            resetSubmitButton();
        }

        function onSuccess() {
            $input.val('');
            $body.removeClass('center-vertical');
            resetSubmitButton();
        }

        function resetSubmitButton() {
            $icon.removeClass('fa-spin').focus();
            $submit.prop('disabled', false);
        }
    });
};
