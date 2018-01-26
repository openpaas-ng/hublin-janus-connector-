'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The JanusFeed factory', function() {
  var $rootScope, JanusFeed, feed, error, pluginHandle, roomId, id, displayName, type, jsSessionEstablishmentProtocol;

  beforeEach(function() {
    error = new Error('meow, I failed 😿');
    pluginHandle = {
      send: sinon.spy(),
      detach: sinon.spy(),
      createOffer: sinon.spy(),
      createAnswer: sinon.spy()
    };
    roomId = 34000;
    id = 'the user id';
    displayName = 'James Bond';
    type = 'local';
    jsSessionEstablishmentProtocol = 'This is some WEBRTC level stuff';

    angular.mock.module('hublin.janus.connector', function() {});

    angular.mock.inject(function(_$rootScope_, _JanusFeed_) {
      $rootScope = _$rootScope_;
      JanusFeed = _JanusFeed_;
    });

    feed = new JanusFeed(pluginHandle, roomId, id, displayName, type);
  });

  describe('The listen function', function() {
    it('should send message to janus', function() {
      feed.listen();

      expect(pluginHandle.send).to.have.been.calledWith({
        message: {
          request: 'join',
          room: roomId,
          ptype: 'listener',
          feed: id
        }
      });
    });
  });

  describe('The publish function', function() {
    it('should create offer correctly', function() {
      feed.publish();

      expect(pluginHandle.createOffer).to.have.been.calledWith({
        // this will change when we will implement options
        media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
        success: sinon.match.func,
        error: sinon.match.func
      });
    });

    describe('The success callback', function() {
      it('should call janus correctly and resolve', function(done) {
        var promise = feed.publish();

        expect(pluginHandle.createOffer).to.have.been.called;

        pluginHandle.createOffer.firstCall.args[0].success(jsSessionEstablishmentProtocol);
        promise.then(function() {
          expect(pluginHandle.send).to.have.been.calledWith({
            message: {
              request: 'configure',
              audio: true,
              video: true
            },
            jsep: jsSessionEstablishmentProtocol
          });
          done();
        })
        .catch(done);
        $rootScope.$digest();
      });
    });

    describe('The error callback', function() {
      it('should reject', function(done) {
        var promise = feed.publish();

        expect(pluginHandle.createOffer).to.have.been.called;

        pluginHandle.createOffer.firstCall.args[0].error(error);
        promise.then(function() {
          done(new Error('Should not be called'));
        })
        .catch(function(err) {
          expect(err).to.equal(error);
          done();
        });
        $rootScope.$digest();
      });
    });
  });

  describe('The join function', function() {
    it('should send message to janus', function() {
      feed.join();

      expect(pluginHandle.send).to.have.been.calledWith({
        message: {
          request: 'join',
          room: roomId,
          ptype: 'publisher',
          display: displayName
        }
      });
    });
  });

  describe('The leave function', function() {
    it('should send message to janus', function() {
      feed.leave();

      expect(pluginHandle.send).to.have.been.calledWith({
        message: {
          request: 'unpublish'
        }
      });
    });
  });

  describe('The destroy function', function() {
    it('should call janus correctly', function() {
      feed.destroy();

      expect(pluginHandle.detach).to.have.been.calledOnce;
    });
  });

  describe('The subscribe function', function() {
    it('should create answer correctly', function() {
      feed.subscribe(jsSessionEstablishmentProtocol);

      expect(pluginHandle.createAnswer).to.have.been.calledWith({
        media: { audio: true, video: true },
        jsep: jsSessionEstablishmentProtocol,
        success: sinon.match.func,
        error: sinon.match.func
      });
    });

    describe('The success callback', function() {
      it('should call janus correctly and resolve', function(done) {
        var promise = feed.subscribe(jsSessionEstablishmentProtocol);

        expect(pluginHandle.createAnswer).to.have.been.called;

        pluginHandle.createAnswer.firstCall.args[0].success(jsSessionEstablishmentProtocol);
        promise.then(function() {
          expect(pluginHandle.send).to.have.been.calledWith({
            message: {
              request: 'start',
              room: roomId
            },
            jsep: jsSessionEstablishmentProtocol
          });
          done();
        })
        .catch(done);
        $rootScope.$digest();
      });
    });

    describe('The error callback', function() {
      it('should reject', function(done) {
        var promise = feed.subscribe(jsSessionEstablishmentProtocol);

        expect(pluginHandle.createAnswer).to.have.been.called;

        pluginHandle.createAnswer.firstCall.args[0].error(error);
        promise.then(function() {
          done(new Error('Should not be called'));
        })
        .catch(function(err) {
          expect(err).to.equal(error);
          done();
        });
        $rootScope.$digest();
      });
    });
  });
});