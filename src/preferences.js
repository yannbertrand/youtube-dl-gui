// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { init as initPreferences } from './preferences/preferences';
import { init as initStorage } from './storage/storage';
import env from './env';

global.Tether = require('tether');
global.jQuery = global.$ = require('jquery');
require('bootstrap-sass');

require('datatables.net')();
require('datatables.net-bs')();


console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

document.addEventListener('DOMContentLoaded', function () {
    initStorage();
    initPreferences();
});
