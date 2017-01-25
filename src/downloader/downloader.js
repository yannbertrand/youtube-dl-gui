import { getBaseDestination, addVideoInDownloads, filterVideoInfoToStore } from '../storage/storage';

const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const { remote } = require('electron');

export var init = function () { };

export var downloadVideo = function (link, onInfo, onProgress, onError, onEnd) {
  let filePath;

  const baseDestination = getBaseDestination();
  if (! fs.existsSync(baseDestination)) {
    fs.mkdirSync(baseDestination);
  }

  const video = youtubedl(
    link,
    ['--format=18'],
    { cwd: baseDestination }
  );

  let size = 0;
  video.on('info', function (info) {
    onInfo(info);

    size = info.size;

    const destination = getDestination(baseDestination, info);
    if (! fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }

    filePath = getFilePath(destination, info);
    video.pipe(fs.createWriteStream(filePath));

    addVideoInDownloads(info.id, filterVideoInfoToStore(info, filePath));
  });

  let position = 0;
  video.on('data', function (chunk) {
    position += chunk.length;

    if (size > 0) {
        onProgress((position / size) * 100);
    }
  });

  video.on('error', onError);
  video.on('end', () => {
    console.log('finished downloading!');
    onEnd(filePath);
  });
};

function getDestination(baseDestination, info) {
  if (info.playlist === null || info.playlist === 'NA') {
    return path.join(baseDestination, info.uploader);
  }

  return path.join(baseDestination, info.uploader, info.playlist);
}

function getFilePath(destination, info) {
  if (info.playlist_index === null || info.playlist_index === 'NA') {
    return path.join(destination, info._filename);
  }

  return path.join(destination, info.playlist_index + ' - ' + info._filename);
}
