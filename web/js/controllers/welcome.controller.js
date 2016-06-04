'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');
var colley = require('colley-rankings');
var async = require('async');
var common = require('../../../common/common');

module.exports = function($scope, $location, experimentService) {
    var timeline = [];
    var subjectData = {};
    timeline.push(
        {
            type: 'instructions',
            pages: [
                '<div align="center">Welcome to the experiment. Click next to begin.</div>'
            ],
            show_clickable_nav: true,
            on_finish: function(data) {
                var params =  common.getQueryParams();
                var midgamId = params.user || params.USER || params.User;
                $.extend(subjectData, { midgam_id: midgamId });
                async.series([
                    function (callback) {
                        experimentService.initExperiment(subjectData)
                            .then(
                                function (result) {
                                    if (!result.data.resourceUrl) {
                                        callback("Error, resourceUrl is undefined", result);
                                    }
                                    experimentService.intiData = result.data;
                                    experimentService.setResourcesUrl(result.data.resourceUrl);
                                    callback(null, result.data)
                                },
                                function (err) {
                                    callback(err);
                                });
                    },
                    function (callback) {
                        experimentService.getExpData()
                            .then(
                                function (result) {
                                    experimentService.expData = $.extend({}, experimentService.intiData, result.data);
                                    experimentService.expData.ranking_key_codes = {
                                        left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.left),
                                        right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.right)
                                    };
                                    callback(null, experimentService.expData);
                                },
                                function (err) {
                                    callback(err);
                                });
                    },
                    function (callback){
                        experimentService.getDemoData()
                            .then(
                                function (result) {
                                    experimentService.demoData = $.extend({}, experimentService.intiData, result.data);
                                    experimentService.demoData.ranking_key_codes = {
                                        left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.left),
                                        right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.right)
                                    };
                                    callback(null, experimentService.demoData);
                                },
                                function (err) {
                                    callback(err);
                                });
                    }
                ], function (err, data){
                    $location.path('fractals1');
                });
            }
        });

    jsPsych.init_data({
        display_element: $('#jspsych-target'), // $($element),
        auto_preload: false,
        timeline: timeline,
        fullscreen: false,
        default_iti: 0,
        on_trial_start: function(){
            common.forceFullScreen();
        },
        on_trial_finish: function(){
            common.forceFullScreen();
        }
    });
};