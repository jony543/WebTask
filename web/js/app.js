var $ = require('jquery');
if (typeof window !== "undefined") {
    // make package available in window context
    window.$ = $;
}
var _ = require('lodash');
var angular = require('angular');

var app = angular.module('experimentApp', []);

require('./services');
require('./controllers');

