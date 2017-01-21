import createWindow from '../helpers/window';
import env from '../env';
import path from 'path';
import url from 'url';

export var editMenuTemplate = {
    label: 'Edit',
    submenu: [
        { role: 'about' },
        { type: "separator" },
        { label: "Preferences...", selector: "preferences:", click: openPreferencesWindow },
        { type: "separator" },
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
};

function openPreferencesWindow() {
    var preferencesWindow = createWindow('preferences', {
        width: 500,
        height: 400
    });

    preferencesWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'preferences.html'),
        protocol: 'file:',
        slashes: true
    }));

    if (env.name === 'development') {
        preferencesWindow.openDevTools();
    }
}
