var $ = require('jquery');
if (typeof window !== "undefined") {
    // make package available in window context
    window.$ = $;
}
var _ = require('lodash');
var angular = require('angular')
var ngRoute = require('angular-route');

var app = angular.module('experimentApp', [ ngRoute ]);

app.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/welcome', {
                templateUrl: 'views/blank_jsPsych.html',
                controller: 'welcomeController'
            })
            .when('/fractals1', {
                templateUrl: 'views/blank_jsPsych.html',
                controller: 'rankingStageController'
            })
            //.when('thankYou', {
            //    templateUrl: 'views/thank_you.html',
            //    controller: 'thankYouController'
            //})
            .otherwise({
                redirectTo: '/welcome'
            });
        $locationProvider.html5Mode(true);
    }]);

require('./services');
require('./controllers');