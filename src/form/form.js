import { downloadVideoAndAddRowToTable } from '../table/table';

export var init = function () {
    const $body = $('body');
    const $form = $body.find('form');
    const $inputGroup = $form.find('.input-group');
    const $input = $inputGroup.find('input');
    const $submit = $form.find('button');
    const $icon = $submit.find('span');

    $input.on('input', function () {
        if ($inputGroup.hasClass('has-danger')) {
            $inputGroup.removeClass('has-danger');
        }
    });

    $form.on('submit', function (event) {
        $icon.addClass('fa-spin');
        $submit.prop('disabled', true);

        downloadVideoAndAddRowToTable($input.val(), onError, onSuccess);

        event.preventDefault();

        function onError(error) {
            console.log(error);
            $inputGroup.addClass('has-danger');
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
