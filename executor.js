/**
 * @module mu-emitter/executor
 */
define([
  "./config",
  "./handler"
], function (config, Handler) {
  "use strict";

  var UNDEFINED;
  var CALLBACK = config.callback;
  var SCOPE = config.scope;
  var HEAD = config.head;
  var NEXT = config.next;

  /**
   * Represents an event executor
   * @alias module:mu-emitter/executor
   */
  return function (event, handlers, args) {
    var _handlers = [];
    var _handlersCount = 0;
    var _handler = event instanceof Handler
      ? event
      : UNDEFINED;
    var _callback = event[CALLBACK];
    var _scope = event[SCOPE];
    var handler;

    for (handler = handlers[HEAD]; handler !== UNDEFINED; handler = handler[NEXT]) {
      if (_handler && _handler !== handler) {
        continue;
      }

      if (_callback && handler[CALLBACK] !== _callback) {
        continue;
      }

      if (_scope && handler[SCOPE] !== _scope) {
        continue;
      }

      _handlers[_handlersCount++] = handler;
    }

    return _handlers.map(function (_handler) {
      return _handler.handle(args);
    });
  }
});
