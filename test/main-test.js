define([
  "../config",
  "../main"
], function (config, Emitter) {
  "use strict";

  var assert = buster.referee.assert;

  var TYPE = config.type;
  var CALLBACK = config.callback;
  var SCOPE = config.scope;

  buster.testCase("troopjs-core/event/emitter", {
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

    "//on/emit reject": function () {
      var emitter = Emitter();

      return emitter
        .on("test", function (pass) {
          return pass
            ? when.resolve()
            : when.reject();
        })
        .on("test", function (pass) {
          assert.isTrue(pass);
        })
        .emit("test", false)
        .then(function () {
          assert(false);
        }, function() {
          assert(true);
        })
        .ensure(function () {
          return emitter
            .emit("test", true)
            .then(function () {
              assert(true);
            }, function() {
              assert(false);
            });
        });
    },

    "//limit - one": function ()  {
      var emitter = Emitter();
      var spy = this.spy();

      return emitter
        .one("test", spy)
        .emit("test")
        .then(function () {
          return emitter.emit("test");
        })
        .then(function () {
          assert.calledOnce(spy);
        });
    },

    "//limit - many": function () {
      var emitter = Emitter();
      var spy = this.spy();

      return emitter
        .on("test", {
          "callback": spy,
          "context": emitter,
          "limit": 2
        })
        .emit("test")
        .then(function () {
          return emitter.emit("test");
        })
        .then(function () {
          return emitter.emit("test");
        })
        .then(function () {
          assert.calledTwice(spy);
        });
    },

    "//bug out in the first event handler": function() {
      var emitter = Emitter();
      var err = new Error("bug out");
      return emitter.on("foo", function() {
        throw err;
      })
        .emit("foo").otherwise(function(error) {
          assert.same(error, err);
        });
    }
  });
});