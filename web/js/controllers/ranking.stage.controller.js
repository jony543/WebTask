'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');
var colley = require('colley-rankings');
var async = require('async');
var common = require('../../../common/common');
var _ = require('lodash');

module.exports = function($scope, $location, experimentService, expData, nextState) {
    // set default expData
    if (!expData)
        expData = experimentService.expData;

    rankingStage(expData, function(err, data){
        expData = data;
        $location.path(nextState);
        $scope.$apply();
    });

    function rankingStage(expData, callback){
        var timeline = [];
        var instructionPages = _.map(expData.ranking_instructions, function(img){
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
        var stimuli = expData.stimuli;
        var stimuliWins = _.map(expData.stimuli, function (stim_item){ return $.extend(stim_item, { wins: 0, losses: 0 }) });

        var l = common.createRandomCompetitions(stimuli, expData.rankingTrials);

        var clly = colley(stimuli.length);

        var ranking_result = {};
        ranking_result.trials = [];
        ranking_result.items_ranking = [];
        ranking_result.trial_count = 0;

        var leftInstruction = "";
        var rightInstruction = "";
        if (expData.showKeyInstruction) {
            leftInstruction = _.toUpper(expData.ranking_keys.left);
            rightInstruction = _.toUpper(expData.ranking_keys.right);
        }

        var n_missed = 0;

        var break_interval = stimuli.length;
        var n_breaks = Math.floor(l.list1.length / break_interval);

        var competitions_stimuli = [];
        for (var i = 0; i < l.list1.length; i++){
            if (i != 0 && i % break_interval == 0){
                // add "take a break" screen
                competitions_stimuli.push({
                    type: 'single-stim',
                    choices: [' '],
                    stimulus:
                        '<div><img style="max-height: 100%; max-width: 100%; width: 100%; height: auto;" src="' + expData.resourceUrl + '/images/instructions/ranking_break.JPG" />' +
                        '<p style="font-size: 26px; text-align:center;">' + Math.floor(i/break_interval) + ' / ' + n_breaks + '</p></div>',
                    is_html: true,
                    timing_response: -1
                });

                competitions_stimuli.push({
                    type: 'single-stim',
                    choices: [],
                    stimulus: '<text class="fixationText"">+</text>',
                    is_html: true,
                    timing_response: 500
                });
            }

            competitions_stimuli.push({
                    timeline: [
                        {
                            type: 'single-stim',
                            choices: [expData.ranking_keys.left, expData.ranking_keys.right],
                            //timing_response: expData.ranking_rt,
                            is_html: true,
                            data: {
                                stim1: l.list1[i],
                                stim2: l.list2[i],
                                nStim1: _.indexOf(stimuli, l.list1[i]),
                                nStim2: _.indexOf(stimuli, l.list2[i])
                            },
                            stimulus:
                            '<div class="leftStim"><img style="width: 100%; padding: 5px;" src="' + expData.resourceUrl + '/images/stimuli/' + l.list1[i] + '" />' +
                            '<div class="instructionContainer"><text class="leftStimInstruction">' + leftInstruction + '</text></div></div>' +
                            '<text class="fixationText">+</text>' +
                            '<div class="rightStim"><img style="width: 100%; padding: 5px;" src="' + expData.resourceUrl + '/images/stimuli/' + l.list2[i] + '" />' +
                            '<div class="instructionContainer"><text class="rightStimInstruction">' + rightInstruction + '</text></div></div>',
                            on_finish: function (data) {
                                var response = 'x';
                                if (data.key_press > 0) {
                                    if (expData.ranking_key_codes.left == data.key_press) {
                                        response = expData.ranking_keys.left;
                                        stimuliWins[data.nStim1].wins += 1;
                                        stimuliWins[data.nStim2].losses += 1;
                                        clly.addGame(data.nStim1, data.nStim2);
                                    } else {
                                        response = expData.ranking_keys.right;
                                        stimuliWins[data.nStim1].losses += 1;
                                        stimuliWins[data.nStim2].wins += 1;
                                        clly.addGame(data.nStim2, data.nStim1);
                                    }
                                }
                                ranking_result.trial_count = ranking_result.trial_count + 1;
                                ranking_result.trials.push({
                                    runtrial: ranking_result.trial_count,
                                    onsettime: data.onset_time / 1000, // onset time in seconds
                                    ImageLeft: data.stim1,
                                    ImageRight: data.stim2,
                                    StimNumLeft: data.nStim1 + 1,  // stimulus number starting from 1
                                    StimNumRight: data.nStim2 + 1,
                                    Response: response,
                                    RT: data.rt
                                });
                            }
                        },
                        {
                            conditional_function: function () {
                                var data = jsPsych.data.getLastTrialData();
                                return data.key_press < 0;
                            },
                            timeline: [
                                {
                                    type: 'multi-stim-multi-response',
                                    choices:  function () {
                                        if (n_missed % 3 == 0) {
                                            return [[32,13]];
                                        } else {
                                            return [[],[]];
                                        }
                                    },
                                    stimuli: function () {
                                        if (n_missed % 3 == 0) {
                                            return [
                                                '<img style="max-height: 100%; max-width: 100%; width: 100%; height: auto;" src="' + expData.resourceUrl + '/images/instructions/answer_quicker_space.JPG" />'
                                            ];
                                        } else {
                                            return [
                                                '<img style="max-height: 100%; max-width: 100%; width: 100%; height: auto;" src="' + expData.resourceUrl + '/images/instructions/answer_quicker.JPG" />',
                                                '<text class="fixationText"">+</text>'
                                            ];
                                        }
                                    },
                                    is_html: true,
                                    timing_stim: function () {
                                        if (n_missed % 3 == 0) {
                                            return [-1];
                                        } else {
                                            return [500, -1];
                                        }
                                    },
                                    timing_response: function () {
                                        if (n_missed % 3 == 0) {
                                            return -1;
                                        } else {
                                            var prevTrial = jsPsych.data.getLastTrialData();
                                            var prevTrialTime = _.min([prevTrial.rt, expData.ranking_rt]);
                                            return expData.ranking_total_time - prevTrialTime;
                                        }
                                    }
                                },
                                {
                                    conditional_function: function () {
                                        return n_missed % 3 == 0;
                                    },
                                    timeline: [
                                        {
                                            type: 'single-stim',
                                            choices: [],
                                            stimulus: '<text class="fixationText"">+</text>',
                                            is_html: true,
                                            timing_response: 500
                                        }
                                    ]
                                },
                                {
                                    type: 'call-function',
                                    func: function () {
                                        n_missed += 1;
                                    }
                                }
                            ]
                        },
                        {
                            conditional_function: function () {
                                var data = jsPsych.data.getLastTrialData();
                                return data.key_press >= 0;
                            },
                            timeline: [
                                {
                                    type: 'multi-stim-multi-response',
                                    choices: [[], []],
                                    stimuli: function(){
                                        var style1 = '';
                                        var style2 = '';
                                        var data = jsPsych.data.getLastTrialData();

                                        if (expData.ranking_key_codes.left == data.key_press) {
                                            style1 = 'background: white;'; //'border: solid 5px green; margin: -5px;';
                                        } else {
                                            style2 = 'background: white;'; //'border: solid 5px green; margin: -5px;';
                                        }

                                        return [
                                            //'<img class="leftStim" src="' + expData.resourceUrl + '/images/stimuli/' + data.stim1 + '" id="jspsych-single-stim-stimulus" style="' + style1 + '"/>' +
                                            //'<text class="fixationText">+</text>' +
                                            //'<img class="rightStim" src="' + expData.resourceUrl + '/images/stimuli/' + data.stim2 + '" id="jspsych-single-stim-stimulus" style="' + style2 + '" />',
                                            //'<text class="fixationText">+</text>'

                                            '<div class="leftStim"><img style="width: 100%; padding: 5px; ' + style1 + '" src="' + expData.resourceUrl + '/images/stimuli/' + data.stim1 + '" />' +
                                            '<div class="instructionContainer"><text class="leftStimInstruction">' + leftInstruction + '</text></div></div>' +
                                            '<text class="fixationText">+</text>' +
                                            '<div class="rightStim"><img style="width: 100%; padding: 5px; ' + style2 + '" src="' + expData.resourceUrl + '/images/stimuli/' + data.stim2 + '" />' +
                                            '<div class="instructionContainer"><text class="rightStimInstruction">' + rightInstruction + '</text></div></div>',

                                            '<text class="fixationText">+</text>'
                                        ];
                                    },
                                    is_html: true,
                                    timing_stim: [500, -1],
                                    timing_response: function () {
                                        var prevTrial = jsPsych.data.getLastTrialData();
                                        var prevTrialTime = _.min([prevTrial.rt, expData.ranking_rt]);
                                        return expData.ranking_total_time - prevTrialTime;
                                    }
                                }
                            ]
                        }
                    ]
                }
            );
        }

        var rankingTrials = {
            timeline: competitions_stimuli
        };

        timeline.push(rankingTrials);

        timeline.push({
            type: 'call-function',
            func: function(){
                var rankings = clly.solve().array;
                var stimuli_ranking = [];
                for (var i=0; i < rankings.length; i++){
                    stimuli_ranking.push({
                        StimName: stimuli[i],
                        Wins: stimuliWins[i].wins,
                        Losses: stimuliWins[i].losses,
                        StimNum: i+1,
                        Rank: rankings[i]
                    });
                }
                expData.sortedStimuli = _.orderBy(stimuli_ranking,'Rank','desc');
                ranking_result.items_ranking = expData.sortedStimuli;
            }
        });


        if (!expData.is_demo) {
            timeline.push(common.waitForServerResponseTrial('/exp/rankings',
                {
                    data: ranking_result,
                    waitText: 'Please wait...',
                    retry_interval: 2000
                }));
        }

        var imagesToPreload = [];
        stimuli.forEach(function(stim){
            imagesToPreload.push(expData.resourceUrl + '/images/stimuli/' + stim);
        });
        imagesToPreload = _.concat(imagesToPreload, _.map(expData.ranking_instructions, function(item){
            return expData.resourceUrl + '/images/instructions/' + item;
        }));
        imagesToPreload.push(expData.resourceUrl + '/images/instructions/ranking_break.JPG');
        imagesToPreload.push(expData.resourceUrl + '/images/instructions/answer_quicker.JPG');
        imagesToPreload.push(expData.resourceUrl + '/images/instructions/answer_quicker_space.JPG');

        jsPsych.pluginAPI.preloadImages(imagesToPreload, function(){
            jsPsych.data.clear();

            jsPsych.init_data({
                display_element: $('#jspsych-target'), // $($element),
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
        });
    }
};