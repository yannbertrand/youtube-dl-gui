export var init = function () {
    const $form = $('form');
    const $input = $form.find('input');
    const $submit = $form.find('button');
    const $icon = $submit.find('span');

    $form.on('submit', function (event) {
        $icon.addClass('fa-spin');
        $submit.prop('disabled', true);
        event.preventDefault();
    });
};
