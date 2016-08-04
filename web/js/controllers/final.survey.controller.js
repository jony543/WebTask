'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');
var common = require('../../../common/common');

module.exports = function($scope, $location, experimentService, expData, nextState) {
    // set default expData
    if (!expData)
        expData = experimentService.expData;

    finalSurvey(expData, function(err, data){
        expData = data;
        $location.path(nextState);
        $scope.$apply();
    });

    function finalSurvey(expData, callback){
        var timeline = [];
        var img = expData.survey_instructions[0];
        var survey_answers = {};

        timeline.push(
            {
                type: 'survey-text',
                preamble: '<img style="max-height: 100%; max-width: 100%; height: auto;" src="' + expData.resourceUrl + '/images/instructions/' + img + '" />',
                questions: [" "],
                rows: [5],
                columns: [50],
                on_finish: function(data) {
                    $.extend(survey_answers, JSON.parse(data.responses));
                }
            }
        );

        timeline.push(common.waitForServerResponseTrial('/exp/finish',
            {
                data: survey_answers,
                waitText: 'Thank you',
                retry_interval: 2000
            }));

        timeline.push({
            type: 'instructions',
            pages: [
                'Thank you'
            ],
            show_clickable_nav: false
        });


        var imagesToPreload = [];
        imagesToPreload = _.concat(imagesToPreload, _.map(expData.survey_instructions, function(item) {
            return expData.resourceUrl + '/images/instructions/' + item;
        }));

        jsPsych.pluginAPI.preloadImages(imagesToPreload, function() {
            jsPsych.data.clear();
            //$($element).find('.loader').hide();
            jsPsych.init_data({
                display_element:  $('#jspsych-target'),
                auto_preload: false,
                timeline: timeline,
                fullscreen: false,
                default_iti: -1,
                on_trial_finish: function(){
                    common.forceFullScreen();
                },
                on_finish: function (data){
                    callback(null, null);
                }
            });
        });
    }
};