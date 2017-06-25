
var $ = require('jquery');
if (typeof window !== "undefined") {
    // make package available in window context
    window.$ = $;
    window.jQuery = $;
}
//require('jquery.cookie');

var _ = require('lodash');
var angular = require('angular');
var ngRoute = require('angular-route');
//var angularUiRouter = require('angular-ui-router');

//require('./utils/ajax.csrf.setup');

var app = angular.module('experimentApp', [ ngRoute ]);

// todo - form string table- where the order of tasks will be determined - instead of hard code (for counterbalancing)
var order = Math.random()
print(order)
if (order>0.5) {
    var expData1= ['$location', 'experimentService', function ($location, experimentService){
        if (!experimentService.prefExpData){
            $location.path('welcome');
            return;
        }
        return experimentService.prefExpData;
    }];
    var expData2=['$location', 'experimentService', function ($location, experimentService){
        if (!experimentService.repExpData){
            $location.path('welcome');
            return;
        }
        return experimentService.repExpData;
    }];
}else{
    var expData1= ['$location', 'experimentService', function ($location, experimentService){
        if (!experimentService.repExpData){
            $location.path('welcome');
            return;
        }
        return experimentService.repExpData
    }];

        expData2= ['$location', 'experimentService', function ($location, experimentService){
        if (!experimentService.prefExpData){
            $location.path('welcome');
            return;
        }
        return experimentService.prefExpData;
    }];
}



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
                    nextState: function() { return 'ranking-demo' }
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
                    expData: ['$location', 'experimentService', function ($location, experimentService){
                        if (!experimentService.demoData){
                            $location.path('welcome');
                            return;
                        }
                        return experimentService.demoData;
                    }]
                }
            })

            .when('/ranking-full', {
                templateUrl: 'views/blank_jsPsych_withLoader.html',
                controller: 'rankingStageController',
                resolve: {
                    nextState: function () {
                        return 'ranking-full'
                    },
                    expData: expData1
                }
            })

            .when('/ranking-full', { //todo assign order (counter balance pref/stability), and call other instructions (like in demo)
                templateUrl: 'views/blank_jsPsych_withLoader.html',
                controller: 'rankingStageController',
                resolve:
                    {
                    nextState: function() { return 'final-survey' },
                    expData: expData2
                }
            })
            .when('/final-survey', {
                templateUrl: 'views/blank_jsPsych.html',
                controller: 'finalSurveyController',
                resolve:
                {
                    nextState: function() { return 'thankyou' },
                    expData: ['$location', 'experimentService', function ($location, experimentService){
                        if (!experimentService.expData){
                            $location.path('welcome');
                            return;
                        }
                        return experimentService.expData;
                    }]
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