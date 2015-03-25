/*globals module:false*/
module.exports["mu-emitter"] = {
  "autoRun": false,

  "environment" : "browser",

  "libs" : [
    "bower_components/requirejs/require.js",
    "require.js"
  ],

  "resources" : [
    "**/*.js"
  ],

  "extensions": [ require("buster-amd") ],

  "buster-amd": {
    "pathMapper": function (path) {
      return path.replace(/\.js$/, "").replace(/^\//, "../");
    }
  },

  "tests" : [
    "test/**/*-test.js"
  ]
};
