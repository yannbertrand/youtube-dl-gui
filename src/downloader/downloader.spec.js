import { expect } from 'chai';
import Storage, { init as initStorage } from '../storage/storage';
import DownloaderFactory, { Downloader, init } from './downloader';

describe('Downloader', function () {
  this.timeout(0);

  beforeEach(function () {
    initStorage();
  });

  afterEach(function () {
    Storage.clear();
  });

  it('start', function (done) {
    const downloader = new Downloader('jNQXAC9IVRw');
    expect(downloader.download).to.be.null;
    expect(downloader.downloaded).to.equal(0);
    expect(downloader.video).to.be.an('object').and.to.deep.equal({ 'id': 'jNQXAC9IVRw' });
    expect(downloader.status).to.equal(Downloader.STATUSES.INIT);
    expect(downloader.progress).to.equal(0);

    downloader.start(onInfo, onProgress, onError, onEnd);
    expect(downloader.status).to.equal(Downloader.STATUSES.WAITING);

    function onInfo() {
      expect(downloader.status).to.equal(Downloader.STATUSES.DOWNLOADING);

      expect(downloader.video).to.be.an('object');
      expect(downloader.video).to.have.property('duration', '19');
      expect(downloader.video).to.have.property('formatId', '18');
      expect(downloader.video).to.have.property('id', 'jNQXAC9IVRw');
      expect(downloader.video).to.have.property('size', 794122);
      expect(downloader.video).to.have.property('title', 'Me at the zoo');
      expect(downloader.video).to.have.property('uploadDate', '20050423');
      expect(downloader.video).to.have.property('uploader', 'jawed');

      done();
    }

    function onProgress(percentage) {

    }

    function onError() {

    }

    function onEnd() {

    }
  });

});
