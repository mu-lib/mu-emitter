define([
  "./config",
  "./executor"
], function (config, executor) {
  "use strict";

  var UNDEFINED;
  var ARRAY_SLICE = Array.prototype.slice;
  var OBJECT_TOSTRING = Object.prototype.toString;
  var TOSTRING_STRING = "[object String]";
  var TOSTRING_FUNCTION = "[object Function]";

  var EMITTER = "emitter";
  var HANDLERS = "handlers";
  var EXECUTOR = config.executor;
  var TYPE = config.type;
  var CALLBACK = config.callback;
  var DATA = config.data;
  var SCOPE = config.scope;
  var LIMIT = config.limit;
  var COUNT = config.count;
  var HEAD = config.head;
  var TAIL = config.tail;
  var NEXT = config.next;
  var ON = "on";
  var OFF = "off";

  function Handler(emitter, type, callback, data) {
    var me = this;

    me[EMITTER] = emitter;
    me[TYPE] = type;
    me[DATA] = data;

    if (OBJECT_TOSTRING.call(callback) === TOSTRING_FUNCTION) {
      me[CALLBACK] = callback;
      me[SCOPE] = emitter;
    }
    else if (callback !== UNDEFINED) {
      me[CALLBACK] = callback[CALLBACK];
      me[SCOPE] = callback[SCOPE] || emitter;

      if (callback.hasOwnProperty(LIMIT)) {
        me[LIMIT] = callback[LIMIT];
        me[COUNT] = 0;
      }
      if (callback.hasOwnProperty(ON)) {
        me[ON] = callback[ON];
      }
      if (callback.hasOwnProperty(OFF)) {
        me[OFF] = callback[OFF];
      }
    }
    else {
      throw new Error("Unable to use 'callback'");
    }
  }

  Handler.prototype.handle = function (args) {
    // Let `me` be `this`
    var me = this;

    // Get result from execution of `handler[CALLBACK]`
    var result = me[CALLBACK].apply(me[SCOPE], args);

    // If there's a `me[LIMIT]` and `++me[COUNT]` is greater or equal to it ...
    if (me.hasOwnProperty(LIMIT) && ++me[COUNT] >= me[LIMIT]) {
      // ... `me[EMITTER].off` `me` (note that `me[CALLBACK]` and `me[SCOPE]` are used by `.off`)
      me[EMITTER].off(me[TYPE], me);
    }

    return result;
  };

  function Emitter() {
  }

  Emitter.prototype[EXECUTOR] = executor;

  Emitter.prototype.on = function (type, callback, data) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;

    if (callback === UNDEFINED) {
      throw new Error("no 'callback' provided");
    }

    handler = new Handler(me, type, callback, data);

    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      handlers[TAIL] = handlers.hasOwnProperty(TAIL)
        ? handlers[TAIL][NEXT] = handler
        : handler[HEAD] = handler;
    }
    else {
      handlers = handlers[type] = {};

      handlers[TYPE] = type;
      handlers[HEAD] = handlers[TAIL] = handler;
    }

    if (handler.hasOwnProperty(ON)) {
      handler[ON].call(me, handler, handlers);
    }
  };

  Emitter.prototype.off = function (type, callback) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;
    var head = UNDEFINED;
    var tail = UNDEFINED;
    var _callback;
    var _scope;

    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      if (OBJECT_TOSTRING.call(callback) === TOSTRING_FUNCTION) {
        _callback = callback;
        _scope = me;
      }
      else if (callback !== UNDEFINED) {
        _callback = callback[CALLBACK];
        _scope = callback[SCOPE];
      }

      for (handler = handlers[HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
        unlink: {
          if (_callback && handler[CALLBACK] !== _callback) {
            break unlink;
          }

          if (_scope && handler[SCOPE] !== _scope) {
            break unlink;
          }

          if (handler.hasOwnProperty(OFF)) {
            handler[OFF].call(me, handler, handlers);
          }

          continue;
        }

        if (head === UNDEFINED) {
          head = tail = handler;
        }
        else {
          tail = tail[NEXT] = handler;
        }
      }

      if (head !== UNDEFINED) {
        handlers[HEAD] = head;
      }
      else {
        delete handlers[HEAD];
      }

      if (tail !== UNDEFINED) {
        handlers[TAIL] = tail;

        delete tail[NEXT];
      }
      else {
        delete handlers[TAIL];
      }
    }
  };

  Emitter.prototype.one = function (type, callback, data) {
    var me = this;
    var _callback;

    if (OBJECT_TOSTRING.call(callback) === TOSTRING_FUNCTION) {
      _callback = {};
      _callback[CALLBACK] = callback;
      _callback[LIMIT] = 1;
    }
    else {
      _callback = callback;
      _callback[LIMIT] = 1;
    }

    return me.on(type, _callback, data);
  };

  Emitter.prototype.emit = function (event) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var _event;
    var _type;
    var _executor;

    if (OBJECT_TOSTRING.call(event) === TOSTRING_STRING) {
      _event = {};
      _type = _event[TYPE] = event;
      _executor = me[EXECUTOR];
    }
    else if (event.hasOwnProperty(TYPE)) {
      _event = event;
      _type = event[TYPE];
      _executor = event[EXECUTOR] || me[EXECUTOR];
    }
    else {
      throw new Error("Unable to use 'event'");
    }


    if (handlers.hasOwnProperty(_type)) {
      handlers = handlers[_type];
    } else {
      handlers = handlers[_type] = {};
      handlers[TYPE] = _type;
    }

    return _executor.call(me, _event, handlers, ARRAY_SLICE.call(arguments, 1));
  };

  return Emitter;
});