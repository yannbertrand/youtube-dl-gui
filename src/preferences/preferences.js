import { getBaseDestination } from '../storage/storage';

const path = require('path');
const fs = require('fs');
const { remote } = require('electron');

let baseDestination;
let filePath;

export var init = function () {
  console.log('init preferences');
  baseDestination = getBaseDestination();

  $('input#base-destination').val(baseDestination);
};
