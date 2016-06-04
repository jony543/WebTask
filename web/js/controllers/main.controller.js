'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');

module.exports = function($scope, experimentService) {
    $scope.message = experimentService.getMessage();

    var welcome_block = {
        type: 'text',
        text: 'Welcome aboard. Press any key...'
    };

    var timeline = [];
    timeline.push(welcome_block);

    angular.element(document).ready(function () {
        //var boost_fractals = require('../../js/experiments/boost_fractals');
        //boost_fractals.run();
        jsPsych.init_data({
            display_element: $('#jspsych-target'),
            timeline: timeline,
            fullscreen: false,
            on_finish: function() {
                jsPsych.data.displayData();
            }
        });
    });
};