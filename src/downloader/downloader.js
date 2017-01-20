const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const { remote } = require('electron');

const DESTINATION_FOLDER = path.join(remote.app.getPath('videos'), 'YouTube');

if (! fs.existsSync(DESTINATION_FOLDER)) {
  fs.mkdirSync(DESTINATION_FOLDER);
}

export var downloadVideo = function (link, onInfo, onError, onEnd) {
  const video = youtubedl(
    link,
    ['--format=18'],
    { cwd: DESTINATION_FOLDER }
  );

  video.on('info', function (info) {
    onInfo(info);

    const destinationFolder = getDestinationFolder(info);
    if (! fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder);
    }

    const destinationFilePath = path.join(destinationFolder, info._filename);
    video.pipe(fs.createWriteStream(destinationFilePath));
  });

  video.on('error', onError);
  video.on('end', onEnd);
};

function getDestinationFolder(info) {
  return path.join(DESTINATION_FOLDER, info.uploader);
}
