import { getBaseDestination, setBaseDestination, getProxy, setProxy } from '../storage/storage';

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
    defaultPath: getBaseDestination(),
    properties: ['openDirectory'],
  }, function (filePaths) {
    if (filePaths === undefined) return;

    setBaseDestination(filePaths[0]);
    refreshBaseDestination();
  });
}

function refreshBaseDestination() {
  $('input#base-destination').val(getBaseDestination());
}


function updateProxy() {
  setProxy($('input#proxy').val());
}

function refreshProxy() {
  $('input#proxy').val(getProxy());
}
