define([
  "../config",
  "../main"
], function (config, Emitter) {
  "use strict";

  var assert = buster.referee.assert;
  var refute = buster.referee.refute;

  var HANDLERS = config.handlers;
  var HEAD = config.head;
  var TYPE = config.type;
  var CALLBACK = config.callback;
  var SCOPE = config.scope;
  var LIMIT = config.limit;

  buster.testCase("mu-emitter/main", {
    "on returns handler": function () {
      var emitter = new Emitter();
      var handler = emitter.on("test", function () {});

      assert.same(handler, emitter[HANDLERS].test[HEAD]);
    },

    "off returns array of handlers": function () {
      var emitter = new Emitter();
      var handler1 = emitter.on("test", function () {});
      var handler2 = emitter.on("test", function () {});

      var handlers = emitter.off("test");

      assert.same(handler1, handlers[0]);
      assert.same(handler2, handlers[1]);
    },

    "handler": {
      ".off forwards to emitter.off": function () {
        var emitter = new Emitter();
        var callback = this.spy();
        var handler = emitter.on("test", callback);

        handler.off();
        emitter.emit("test", "test");

        refute.called(callback);
      },

      ".off only removes exact handler": function () {
        var emitter = new Emitter();
        var callback = this.spy();
        var handler = emitter.on("test", callback);

        emitter.on("test", callback);
        handler.off();
        emitter.emit("test", "test");

        assert.calledOnce(callback);
      }
    },

    "emit" : function () {
      var emitter = new Emitter();
      var callback = this.spy();

      emitter.on("test", callback);
      emitter.emit("test", "test");

      assert.calledOnce(callback);
      assert.calledWith(callback, "test");

      emitter.emit("test", "one", "two", "three");

      assert.calledTwice(callback);
      assert.calledWith(callback, "one", "two", "three");
    },

    "emit with scope": function () {
      var emitter = new Emitter();
      var scope1 = {};
      var scope2 = {};
      var callback;
      var callback1 = this.spy();
      var callback2 = this.spy();

      callback = {};
      callback[SCOPE] = scope1;
      callback[CALLBACK] = callback1;
      emitter.on("test", callback);

      callback = {};
      callback[SCOPE] = scope2;
      callback[CALLBACK] = callback2;
      emitter.on("test", callback);

      emitter.emit("test");

      assert.calledOnce(callback1);
      assert.calledOn(callback1, scope1);
      assert.calledOnce(callback2);
      assert.calledOn(callback2, scope2);
    },

    "emit with scope filtering": function() {
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

    "emit with callback filtering": function() {
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

    "off with scope filtering": function() {
      var emitter = new Emitter();
      var scope1 = {};
      var scope2 = {};
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

      emitter.emit("test");

      assert.calledTwice(callback1);

      callback = {};
      callback[SCOPE] = scope2;
      emitter.off("test", callback);
      emitter.emit("test");

      assert.calledThrice(callback1);
    },

    "off with callback filtering": function() {
      var emitter = new Emitter();
      var scope1 = {};
      var scope2 = {};
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

      emitter.emit("test");

      assert.calledTwice(callback1);

      callback = {};
      callback[CALLBACK] = callback1;
      emitter.off("test", callback);

      emitter.emit("test");

      assert.calledTwice(callback1);
    },

    "emit reject": function () {
      var emitter = new Emitter();
      var callback1 = this.spy(function (pass) {
        if (pass !== true) {
          throw new Error("test");
        }

        return pass;
      });
      var callback2 = this.spy();

      emitter.on("test", callback1);
      emitter.on("test", callback2);

      try {
        emitter.emit("test", false);
      }
      catch (e) {
      }

      assert.calledOnce(callback1);
      assert.threw(callback1);
      refute.called(callback2);

      try {
        emitter.emit("test", true);
      }
      catch (e) {
      }

      assert.calledTwice(callback1);
      assert.calledOnce(callback2);
    },

    "limit - one": function ()  {
      var emitter = new Emitter();
      var callback = this.spy();

      emitter.one("test", callback);
      emitter.emit("test");
      emitter.emit("test");

      assert.calledOnce(callback);
    },

    "limit - many": function () {
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
