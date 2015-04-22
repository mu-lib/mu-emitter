define([
  "../config",
  "../main"
], function (config, Emitter) {
  "use strict";

  var assert = buster.referee.assert;
  var refute = buster.referee.refute;

  var DATA = config.data;

  buster.testCase("mu-emitter/handler", {
    "handler.data is undefined by default": function () {
      var handler = new Emitter().on("test", function () {});

      refute.defined(handler[DATA]);
    },

    "emitter.on stores rest parameters as handler.data": function () {
      var handler = new Emitter().on("test", function () {}, 1, 2, 3);

      assert.equals(handler[DATA], [ 1, 2, 3 ]);
    },

    "emitter.one stores rest parameters as handler.data": function () {
      var handler = new Emitter().one("test", function () {}, 1, 2, 3);

      assert.equals(handler[DATA], [ 1, 2, 3 ]);
    },

    "off forwards to emitter.off": function () {
      var emitter = new Emitter();
      var callback = this.spy();
      var handler = emitter.on("test", callback);

      handler.off();
      emitter.emit("test", "test");

      refute.called(callback);
    },

    "off only removes exact handler": function () {
      var emitter = new Emitter();
      var callback = this.spy();
      var handler = emitter.on("test", callback);

      emitter.on("test", callback);
      handler.off();
      emitter.emit("test", "test");

      assert.calledOnce(callback);
    }
  });
});
