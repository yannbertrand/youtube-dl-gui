import Storage from '../storage/storage';

const { remote } = require('electron');


export var init = function () {
  console.log('init preferences');

  refreshBaseDestination();
  $('input#base-destination').parent().find('button').on('click', selectBaseDestination);

  refreshProxy();
  $('input#proxy').on('input', updateProxy);
};

function selectBaseDestination() {
  remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {
    defaultPath: Storage.getBaseDestination(),
    properties: ['openDirectory'],
  }, function (filePaths) {
    if (filePaths === undefined) return;

    Storage.setBaseDestination(filePaths[0]);
    refreshBaseDestination();
  });
}

function refreshBaseDestination() {
  $('input#base-destination').val(Storage.getBaseDestination());
}


function updateProxy() {
  Storage.setProxy($('input#proxy').val());
}

function refreshProxy() {
  $('input#proxy').val(Storage.getProxy());
}
