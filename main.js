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
  var LENGTH = "length";

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
   * @return {Handler|*}
   */
  Emitter.prototype.on = function (type, callback) {
    var me = this;
    var length = arguments[LENGTH];
    var data;
    var handlers = me[HANDLERS] || (me[HANDLERS] = {});
    var handler;

    if (callback === UNDEFINED) {
      throw new EmitterError("no 'callback' provided");
    }

    // check if we have rest arguments
    if (length > 2) {
      data = new Array(length - 2);

      // let `data` be `Array.prototyps.slice.call(arguments, 2)` without deop
      while (length-- > 2) {
        data[ length - 2 ] = arguments[length];
      }

      // create `handler` with `data`
      handler = new Handler(me, type, callback, data);
    }
    else {
      // create `handler` without `data`
      handler = new Handler(me, type, callback);
    }

    // if we have `handlers` for this `type` use them ...
    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      // re-link `handlers[TAIL]`
      handlers[TAIL] = handlers.hasOwnProperty(TAIL)
        ? handlers[TAIL][NEXT] = handler
        : handlers[HEAD] = handler;
    }
    // ... otherwise we have to create and initialize
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

    // no point of continuing if `handlers` has no `type`
    if (handlers.hasOwnProperty(type)) {
      handlers = handlers[type];

      // if no `callback` is passed we remove _all_ `handlers` ...
      if (callback === UNDEFINED) {
        for (handler = handlers[HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
          result[length++] = handler;
        }

        delete handlers[HEAD];
        delete handlers[TAIL];
      }
      // ... otherwise check if filter param wer passed
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
          // the end of `unlink` will unlink the current `handler` and `continue` the loop
          // since the default is to unlink we check if filter parameters were provided but not matching to `break`
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

          // update `head`, `tail` or both
          if (head === UNDEFINED) {
            head = tail = handler;
          }
          else {
            tail = tail[NEXT] = handler;
          }
        }

        // set or `delete` `handlers[HEAD]`
        if (head !== UNDEFINED) {
          handlers[HEAD] = head;
        }
        else {
          delete handlers[HEAD];
        }

        // set or `delete` `handlers[TAIL]`
        if (tail !== UNDEFINED) {
          handlers[TAIL] = tail;

          // make sure to clean up `tail[NEXT]`
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
   * @return {Handler|*}
   */
  Emitter.prototype.one = function (type, callback) {
    var me = this;
    var length = arguments[LENGTH];
    var args;
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

    // check if rest arguments were provided
    if (length > 2) {
      // create `args`
      args = new Array(length - 1);

      // let `args` be `Array.prototyps.slice.call(arguments)` without deop
      while (length--) {
        args[length] = arguments[length];
      }

      // let `args[1]` be `_callback`
      args[1] = _callback;
    }

    // return result from calling or applying `.on` depending on if we have `args`
    return args !== UNDEFINED
      ? me.on.apply(me, args)
      : me.on(type, _callback);
  };

  /**
   * Emits an event
   * @param {String|Object} event Event type
   * @param {...*} [args] Arguments to pass to handlers
   * @return {*}
   */
  Emitter.prototype.emit = function (event) {
    var me = this;
    var args = arguments;
    var length = args[LENGTH];
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
