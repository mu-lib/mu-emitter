/**
 * @module mu-emitter/error
 */
define([ "mu-error/factory" ], function (Factory) {
  "use strict";

  /**
   * Represents an event emitter error
   * @constructor
   * @alias module:mu-emitter/error
   */
  return Factory("EmitterError");
});
