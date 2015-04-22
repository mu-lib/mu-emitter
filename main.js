/**
 * @module mu-emitter/main
 * @exports mu-emitter/main
 */
define([
  "./config",
  "./handler",
  "./executor",
  "./error"
], function (config, Handler, executor, EmitterError) {
  "use strict";

  var UNDEFINED;
  var OBJECT_TOSTRING = Object.prototype.toString;
  var TOSTRING_STRING = "[object String]";
  var TOSTRING_FUNCTION = "[object Function]";

  var HANDLERS = config.handlers;
  var EXECUTOR = config.executor;
  var TYPE = config.type;
  var CALLBACK = config.callback;
  var SCOPE = config.scope;
  var LIMIT = config.limit;
  var HEAD = config.head;
  var TAIL = config.tail;
  var NEXT = config.next;

  /**
   * Represents an event emitter
   * @constructor
   * @alias module:mu-emitter/main
   */
  function Emitter() {
  }

  Emitter.prototype[EXECUTOR] = executor;

  /**
   * Adds an event handler
   * @param {String} type
   * @param {Function|Object} callback
   * @param {Array} [data]
   * @return {Handler|*}
   */
  Emitter.prototype.on = function (type, callback, data) {
    var me = this;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;

    if (callback === UNDEFINED) {
      throw new EmitterError("no 'callback' provided");
    }

    handler = new Handler(me, type, callback, data);

    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      handlers[TAIL] = handlers.hasOwnProperty(TAIL)
        ? handlers[TAIL][NEXT] = handler
        : handlers[HEAD] = handler;
    }
    else {
      handlers = handlers[type] = {};

      handlers[TYPE] = type;
      handlers[HEAD] = handlers[TAIL] = handler;
    }

    return handler;
  };

  /**
   * Removes an event handler
   * @param {String} type Event type
   * @param {module:mu-emitter/handler|Function|Object} [callback]
   * @return {Array} Removed handlers
   */
  Emitter.prototype.off = function (type, callback) {
    var me = this;
    var result = [];
    var length = 0;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;
    var head = UNDEFINED;
    var tail = UNDEFINED;
    var _handler;
    var _callback;
    var _scope;

    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      if (callback === UNDEFINED) {
        for (handler = handlers[HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
          result[length++] = handler;
        }

        delete handlers[HEAD];
        delete handlers[TAIL];
      }
      else {
        if (callback instanceof Handler) {
          _handler = callback;
        }
        else if (OBJECT_TOSTRING.call(callback) === TOSTRING_FUNCTION) {
          _callback = callback;
          _scope = me;
        }
        else {
          _callback = callback[CALLBACK];
          _scope = callback[SCOPE];
        }

        for (handler = handlers[HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
          unlink: {
            if (_handler && handler !== _handler) {
              break unlink;
            }

            if (_callback && handler[CALLBACK] !== _callback) {
              break unlink;
            }

            if (_scope && handler[SCOPE] !== _scope) {
              break unlink;
            }

            result[length++] = handler;

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
    }

    return result;
  };

  /**
   * Adds an event handler that will be called at most once
   * @param {String} type
   * @param {Function|Object} callback
   * @param {Array} [data]
   * @return {Handler|*}
   */
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

  /**
   * Emits an event
   * @param {String|Object} event Event type
   * @param {...*} args Arguments to pass to handlers
   * @return {*}
   */
  Emitter.prototype.emit = function (event) {
    var me = this;
    var args = arguments;
    var length = args.length;
    var _args = new Array(length - 1);
    var _handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var _event;
    var _type;
    var _executor;

    // let `args` be `Array.prototyps.slice.call(arguments, 1)` without deop
    while (length-- > 1) {
      _args[length - 1] = args[length];
    }

    // If we `event` is a string use defaults ...
    if (OBJECT_TOSTRING.call(event) === TOSTRING_STRING) {
      _event = {};
      _type = _event[TYPE] = event;
      _executor = me[EXECUTOR];
    }
    // ... or if we ducktype TYPE extract params ...
    else if (event.hasOwnProperty(TYPE)) {
      _event = event;
      _type = event[TYPE];
      _executor = event[EXECUTOR] || me[EXECUTOR];
    }
    // ... or bail out
    else {
      throw new EmitterError("Unable to use 'event'");
    }


    // If we have `_handlers[type]` use it ...
    if (_handlers.hasOwnProperty(_type)) {
      _handlers = _handlers[_type];
    }
    // ... otherwise create it
    else {
      _handlers = _handlers[_type] = {};
      _handlers[TYPE] = _type;
    }

    // Call `_executor` and return
    return _executor.call(me, _event, _handlers, _args);
  };

  return Emitter;
});
