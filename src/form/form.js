export var init = function () {
    const $form = $('form');
    const $input = $form.find('input');
    const $submit = $form.find('button');

    $form.on('submit', function (event) {
        $submit.prop('disabled', true);
        event.preventDefault();
    });
};
