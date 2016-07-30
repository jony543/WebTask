var $ = require('jquery');
if (typeof window !== "undefined") {
    // make package available in window context
    window.$ = $;
    window.jQuery = $;
}
var _ = require('lodash');
var angular = require('angular');
var ngRoute = require('angular-route');
//var angularUiRouter = require('angular-ui-router');

var app = angular.module('experimentApp', [ ngRoute ]);

app.config(['$routeProvider', '$locationProvider',
    function( $routeProvider, $locationProvider) {
        $routeProvider
            .when('/fractals/', {
                templateUrl: 'views/welcome.html',
                controller: 'welcomeController',
                resolve: {
                    nextState: function() { return 'ranking-demo' }
                }
            })
            .when('/welcome/', {
                templateUrl: 'views/welcome.html',
                controller: 'welcomeController',
                resolve: {
                    nextState: function() { return 'slider-ranking' }
                }
            })
            .when('/welcome/:midgam_user', {
                templateUrl: 'views/welcome.html',
                controller: 'welcomeController',
                resolve: {
                    nextState: function() { return 'ranking-demo' }
                }
            })
            .when('/ranking-demo', {
                templateUrl: 'views/blank_jsPsych_withLoader.html',
                controller: 'rankingStageController',
                resolve: {
                    nextState: function() { return 'ranking-full' },
                    expData: function ($location, experimentService){
                        if (!experimentService.demoData){
                            $location.path('welcome');
                            return;
                        }
                        return experimentService.demoData;
                    }
                }
            })
            .when('/ranking-full', {
                templateUrl: 'views/blank_jsPsych_withLoader.html',
                controller: 'rankingStageController',
                resolve:
                {
                    nextState: function() { return 'slider-ranking' },
                    expData: function ($location, experimentService){
                        if (!experimentService.expData){
                            $location.path('welcome');
                            return;
                        }
                        return experimentService.expData;
                    }
                }
            })
            .when('/slider-ranking', {
                templateUrl: 'views/blank_jsPsych_withLoader.html',
                controller: 'sliderRankingController',
                resolve:
                {
                    nextState: function() { return 'final-survey' },
                    expData: function ($location, experimentService){
                        if (!experimentService.expData){
                            $location.path('welcome');
                            return;
                        }
                        return experimentService.expData;
                    }
                }
            })
            .when('/final-survey', {
                templateUrl: 'views/blank_jsPsych.html',
                controller: 'finalSurveyController',
                resolve:
                {
                    nextState: function() { return 'thankyou' },
                    expData: function ($location, experimentService){
                        if (!experimentService.expData){
                            $location.path('welcome');
                            return;
                        }
                        return experimentService.expData;
                    }
                }
            })
            .when('/thankyou', {
                templateUrl: 'views/thank_you.html',
                controller: 'thankYouController'
            })
            .otherwise({
                redirectTo: '/welcome'
            });
    }]);

require('./services');
require('./controllers');