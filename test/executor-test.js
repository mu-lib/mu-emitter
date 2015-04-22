define([
  "../config",
  "../main"
], function (config, Emitter) {
  "use strict";

  var assert = buster.referee.assert;

  var TYPE = config.type;
  var CALLBACK = config.callback;
  var SCOPE = config.scope;
  var LIMIT = config.limit;

  buster.testCase("mu-emitter/executor", {
    "handler filtering": function () {
      var emitter = new Emitter();
      var callback = this.spy();
      var handler1 = emitter.on("test", callback);
      var handler2 = emitter.on("test", callback);

      emitter.emit(handler1);

      assert.calledOnce(callback);

      emitter.emit(handler2);

      assert.calledTwice(callback);
    },

    "scope filtering": function() {
      var emitter = new Emitter();
      var scope1 = {};
      var scope2 = {};
      var event;
      var callback;
      var callback1 = this.spy();

      callback = {};
      callback[SCOPE] = scope1;
      callback[CALLBACK] = callback1;
      emitter.on("test", callback);

      callback = {};
      callback[SCOPE] = scope2;
      callback[CALLBACK] = callback1;
      emitter.on("test", callback);

      event = {};
      event[TYPE] = "test";
      event[SCOPE] = scope1;
      emitter.emit(event);

      assert.calledOnce(callback1);

      event = {};
      event[TYPE] = "test";
      event[SCOPE] = scope2;
      emitter.emit(event);

      assert.calledTwice(callback1);
    },

    "callback filtering": function() {
      var emitter = new Emitter();
      var event;
      var callback1 = this.spy();
      var callback2 = this.spy();

      emitter.on("test", callback1);
      emitter.on("test", callback2);
      emitter.emit("test");

      assert.calledOnce(callback1);
      assert.calledOnce(callback2);

      event = {};
      event[TYPE] = "test";
      event[CALLBACK] = callback1;
      emitter.emit(event);

      assert.calledTwice(callback1);
      assert.calledOnce(callback2);

      event = {};
      event[TYPE] = "test";
      event[CALLBACK] = callback2;
      emitter.emit(event);

      assert.calledTwice(callback1);
      assert.calledTwice(callback2);
    },

    "limit": function () {
      var emitter = new Emitter();
      var callback = this.spy();
      var event = {};

      event[CALLBACK] = callback;
      event[LIMIT] = 2;

      emitter.on("test", event);
      emitter.emit("test");
      emitter.emit("test");
      emitter.emit("test");

      assert.calledTwice(callback);
    }
  });
});
