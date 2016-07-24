'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');
var common = require('../../../common/common');

module.exports = function($scope, $location, experimentService, expData, nextState) {
    // set default expData
    if (!expData)
        expData = experimentService.expData;

    rankStimuli(expData, function(err, data){
        expData = data;
        $location.path(nextState);
        $scope.$apply();
    });

    function rankStimuli(expData, callback){
        var timeline = [];

        if (expData.slider_instructions) {
            var instructionPages = _.map(expData.slider_instructions, function (img) {
                return '<img style="max-height: 100%; max-width: 100%; height: auto;" src="' + expData.resourceUrl + '/images/instructions/' + img + '" />'
            });
            if (instructionPages && instructionPages.length > 0) {
                timeline.push(
                    {
                        type: 'instructions',
                        pages: instructionPages,
                        key_forward: ' ',
                        allow_backward: false,
                        show_clickable_nav: false
                    }
                );
            }
        }

        var rankingRange = 100;
        var result = {};
        result.trials = [];
        result.ranking_range = rankingRange;
        result.trial_count  = 0;

        var trials = _.map(_.shuffle(expData.stimuli), function (stim){
            var stimUrl = expData.resourceUrl + '/images/stimuli/' + stim;
            return {
                type: 'similarity',
                is_html: false,
                stimuli: [stimUrl, stimUrl],
                labels: ['0', '10'],
                data: {
                    stimName: stim
                },
                prompt: '', //'Please rank the image above', // '<img src=""'+ expData.resourceUrl + '/images/instructions/slider_trial_instruction.JPG' + '" />',
                show_response: 'FIRST_STIMULUS',
                intervals: rankingRange,
                timing_image_gap: -1,
                on_finish: function(data){
                    result.trials.push({
                        StimName: data.stimName,
                        Score: data.sim_score,
                        RT: data.rt
                    });
                    result.trial_count = result.trial_count + 1;
                }
            };
        });

        timeline.push({
            timeline: trials
        });

        if (!expData.is_demo) {
            timeline.push(common.waitForServerResponseTrial('/exp/slider_ranking',
                {
                    data: result,
                    waitText: 'Please wait...',
                    retry_interval: 2000
                }));
        }

        jsPsych.data.clear();

        jsPsych.init_data({
            display_element: $('#jspsych-target'),
            auto_preload: false,
            timeline: timeline,
            fullscreen: false,
            default_iti: 0,
            on_trial_finish: function(){
                common.forceFullScreen();
            },
            on_finish: function (data){
                callback(null, expData);
            }
        });
    };
};