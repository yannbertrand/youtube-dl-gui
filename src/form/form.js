import DownloadsTable from '../table/table';

const isYouTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;

export default Form;

class Form {

  constructor() {
    this.initElements();

    this.$input.on('input', () => this.onInput());
    this.$form.on('submit', (event) => this.onFormSubmit(event));

    this.downloadsTable = new DownloadsTable($('table'));
  }

  onInput() {
    if (this.$inputGroup.hasClass('has-danger')) {
      this.$inputGroup.removeClass('has-danger');
    }
  }

  onFormSubmit(event) {
    event.preventDefault();

    const link = this.$input.val();
    if (! isYouTubeRegex.test(link)) {
      return this.onError('Not a YouTube link');
    }

    this.$icon.addClass('fa-spin');
    this.$submitButton.prop('disabled', true);

    this.downloadsTable.downloadVideo(link, () => this.onSuccess(), (error) => this.onError(error));
  }

  onSuccess() {
    this.$input.val('');
    this.$body.removeClass('center-vertical');
    this.resetSubmitButton();
  }

  onError(error) {
    console.log(error);
    this.$inputGroup.addClass('has-danger');
    this.resetSubmitButton();
  }

  resetSubmitButton() {
    this.$icon.removeClass('fa-spin').focus();
    this.$submitButton.prop('disabled', false);
  }

  initElements() {
    this.$body = $('body');
    this.$form = this.$body.find('form');
    this.$inputGroup = this.$form.find('.input-group');
    this.$input = this.$inputGroup.find('input');
    this.$submitButton = this.$form.find('button');
    this.$icon = this.$submitButton.find('span');
  }

}
