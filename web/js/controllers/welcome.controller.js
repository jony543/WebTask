'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');
var colley = require('colley-rankings');
var async = require('async');
var common = require('../../../common/common');
var _ = require('lodash');

module.exports = function($scope, $location, $routeParams, experimentService, nextState) {

    $scope.startExperiment  = function(){
        $("jspsych-target").html('<div class="loader"></div>');
        common.forceFullScreen();

        async.waterfall([
                function (callback){
                    var midgamId = $routeParams.midgam_user || $routeParams.user || $routeParams.USER || $routeParams.User;
                    var data = $.extend({}, { midgam_id: midgamId });
                    callback(null, data);
                },
                function (subject_data, callback) {
                    experimentService.initExperiment(subject_data)
                        .then(
                            function (result) {
                                if (!result.data.resourceUrl) {
                                    callback("Error, resourceUrl is undefined", result);
                                }
                                experimentService.setResourcesUrl(result.data.resourceUrl);
                                callback(null, result.data)
                            },
                            function (err) {
                                callback(err);
                            });
                },
                function (init_data, callback){
                    experimentService.getExpData2()
                        .then(
                            function (result) {
                                experimentService.expData2 = $.extend({}, init_data, result.data);
                                experimentService.expData2.ranking_key_codes = {
                                    left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.left),
                                    right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.right)
                                };
                                callback(null, experimentService.expData2);
                            },
                            function (err) {
                                callback(err);
                            });
                },
                function (init_data, callback) {
                    experimentService.getExpData()
                        .then(
                            function (result) {
                                experimentService.expData = $.extend({}, init_data, result.data);
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
                function (init_data, callback){
                    experimentService.getDemoData()
                        .then(
                            function (result) {
                                experimentService.demoData = $.extend({}, init_data, result.data);
                                experimentService.demoData.ranking_key_codes = {
                                    left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.left),
                                    right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(experimentService.expData.ranking_keys.right)
                                };
                                callback(null, experimentService.demoData);
                            },
                            function (err) {
                                callback(err);
                            });
                },

                function(data, callback){ welcome(experimentService.expData, callback); }
            ],
            function(err, results){
                if (err){
                    console.log(err);
                    console.log(results);

                    $location.path('/');
                    $scope.$apply();
                }
                else {
                    $location.path(nextState);
                    $scope.$apply();
                }
            })
    };

    function welcome(expData, callback){
        var timeline = [];
        var subjectData = {};

        var instructionPages = _.map(expData.welcome_instructions, function(img){
            return '<img style="max-height: 100%; max-width: 100%; height: auto;" src="' + expData.resourceUrl + '/images/instructions/' + img + '" />'
        });
        timeline.push(
            {
                type: 'instructions',
                pages: instructionPages,
                key_forward: ' ',
                allow_backward: false,
                show_clickable_nav: false
            }
        );

        var imagesToPreload = [];
        imagesToPreload = _.concat(imagesToPreload, _.map(expData.welcome_instructions, function(item) {
            return expData.resourceUrl + '/images/instructions/' + item;
        }));

        jsPsych.data.clear();
        jsPsych.pluginAPI.preloadImages(imagesToPreload, function() {
            common.forceFullScreen();

            jsPsych.init_data({
                display_element: $('#jspsych-target'), // $($element),
                auto_preload: false,
                timeline: timeline,
                fullscreen: false,
                default_iti: 0,
                on_trial_finish: function () {
                    common.forceFullScreen();
                },
                on_finish: function (data) {
                    callback(null, null);
                }
            });
        });
    }
};