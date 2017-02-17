import { expect } from 'chai';
import Storage from './storage';

describe('Storage', function () {

  it('downloads', function () {
    const video = { title: '[10 DAYS / 10 SONGS] Episode 06 - Enregistrement "Ce Matin"', uploader: 'pvnova' };
    expect(Storage.getDownloads()).to.be.an('object').and.be.empty;
    expect(Storage.hasVideoInDownloads('tQ3GUafZ6ow')).to.be.false;

    Storage.addVideoInDownloads('tQ3GUafZ6ow', video);
    expect(Storage.hasVideoInDownloads('tQ3GUafZ6ow')).to.be.true;

    expect(function () { Storage.addVideoInDownloads('tQ3GUafZ6ow', video); }).to.throw(Error);

    Storage.removeVideoFromDownloads('tQ3GUafZ6ow');
    expect(Storage.hasVideoInDownloads('tQ3GUafZ6ow')).to.be.false;
  });

});
