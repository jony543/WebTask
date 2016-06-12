'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');
var colley = require('colley-rankings');
var async = require('async');
var common = require('../../../common/common');

module.exports = function($scope, $element, experimentService) {
    angular.element(document).ready(function () {
    });

    $scope.expData = undefined;
    $scope.demoData = undefined;

    $scope.startExperiment  = function(){
        $($element).html('<div class="loader"></div>');
        common.forceFullScreen();

        async.waterfall([
            function (callback){
                var params =  common.getQueryParams();
                var midgamId = params.user || params.USER || params.User;
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
            function (init_data, callback) {
                experimentService.getExpData()
                    .then(
                        function (result) {
                            $scope.expData = $.extend({}, init_data, result.data);
                            $scope.expData.ranking_key_codes = {
                                left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode($scope.expData.ranking_keys.left),
                                right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode($scope.expData.ranking_keys.right)
                            };
                            callback(null, $scope.expData);
                        },
                        function (err) {
                            callback(err);
                        });
            },
            function (init_data, callback){
                experimentService.getDemoData()
                    .then(
                        function (result) {
                            $scope.demoData = $.extend({}, init_data, result.data);
                            $scope.demoData.ranking_key_codes = {
                                left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode($scope.expData.ranking_keys.left),
                                right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode($scope.expData.ranking_keys.right)
                            };
                            callback(null, $scope.demoData);
                        },
                        function (err) {
                            callback(err);
                        });
            },

            function(data, callback){ welcome($scope.expData, callback); },

            function(data, callback){
                $($element).html('<div class="loader"></div>');
                rankingStage($scope.demoData, function(err, data) { $scope.demoData = data; callback(err, data); });
            },
            function(data, callback){
                $($element).html('<div class="loader"></div>');
                rankingStage($scope.expData, function(err, data) { $scope.expData = data; callback(err, data); });
            },
            function(data, callback){
                $($element).html('<div class="loader"></div>');
                finalSurvey($scope.expData, callback);
            }
            //function(data, callback) { secondStage($scope.demoData, function(err, data) { $scope.demoData = data; callback(err, data); }); },
            //function(data, callback) { secondStage($scope.expData, function(err, data) { $scope.expData = data; callback(err, data); }); }
            ],
            function(err, results){
                if (err){
                    console.log(err);
                    console.log(results);
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
                display_element: $($element),
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
                columns: [100],
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
            $($element).find('.loader').hide();
            jsPsych.init_data({
                display_element: $($element),
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

        var competitions_stimuli = [];
        for (var i = 0; i < l.list1.length; i++){
            competitions_stimuli.push({
                    timeline: [
                        {
                            type: 'single-stim',
                            choices: [expData.ranking_keys.left, expData.ranking_keys.right],
                            timing_response: expData.ranking_rt,
                            is_html: true,
                            data: {
                                stim1: l.list1[i],
                                stim2: l.list2[i],
                                nStim1: _.indexOf(stimuli, l.list1[i]),
                                nStim2: _.indexOf(stimuli, l.list2[i])
                            },
                            stimulus:
                            '<img class="leftStim" src="' + expData.resourceUrl + '/images/stimuli/' + l.list1[i] + '" />' +
                            '<text class="leftStimInstruction">' + leftInstruction + '</text>' +
                            '<text class="fixationText">+</text>' +
                            '<img class="rightStim" src="' + expData.resourceUrl + '/images/stimuli/' + l.list2[i] + '" />' +
                            '<text class="rightStimInstruction">' + rightInstruction + '</text>',
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
                                    onsettime: data.onset_time,
                                    ImageLeft: data.stim1,
                                    ImageRight: data.stim2,
                                    StimNumLeft: data.nStim1,
                                    StimNumRight: data.nStim2,
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
                            timeline: [{
                                type: 'multi-stim-multi-response',
                                choices: [[], []],
                                stimuli: [
                                    '<p style="font-size: 32px; text-align:center;">You must respond faster</p>',
                                    '<text class="fixationText"">+</text>'],
                                is_html: true,
                                timing_stim: [500, -1],
                                timing_response: function () {
                                    var prevTrial = jsPsych.data.getLastTrialData();
                                    var prevTrialTime = _.min([prevTrial.rt, expData.ranking_rt]);
                                    return expData.ranking_total_time - prevTrialTime;
                                }
                            }]
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
                                            style1 = 'background: green;'; //'border: solid 5px green; margin: -5px;';
                                        } else {
                                            style2 = 'background: green;'; //'border: solid 5px green; margin: -5px;';
                                        }

                                        return [
                                            '<img class="leftStim" src="' + expData.resourceUrl + '/images/stimuli/' + data.stim1 + '" id="jspsych-single-stim-stimulus" style="' + style1 + '"/>' +
                                            '<text class="fixationText">+</text>' +
                                            '<img class="rightStim" src="' + expData.resourceUrl + '/images/stimuli/' + data.stim2 + '" id="jspsych-single-stim-stimulus" style="' + style2 + '" />',
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
                        }]
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

        jsPsych.pluginAPI.preloadImages(imagesToPreload, function(){
            jsPsych.data.clear();

            jsPsych.init_data({
                display_element: $($element),
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

    function secondStage(expData, callback) {
        var audioFile = expData.resourceUrl + '/audio/' + expData.trainingSound;
        var trainingStimuli =
            _.map(expData.sortedStimuli, function (stim, idx) {
                if (_.includes(expData.LV_GO_idxs, idx)) {
                    return {
                        img: stim.StimName,
                        type: '22',
                        show: true,
                        high: false,
                        go: true
                    };
                }
                if (_.includes(expData.LV_NOGO_idxs, idx)) {
                    return {
                        img: stim.StimName,
                        type: '24',
                        show: true,
                        high: false,
                        go: false
                    };
                }
                if (_.includes(expData.HV_GO_idxs, idx)) {
                    return {
                        img: stim.StimName,
                        type: '11',
                        show: true,
                        high: true,
                        go: true
                    };
                }
                if (_.includes(expData.HV_NOGO_idxs, idx)) {
                    return {
                        img: stim.StimName,
                        type: '12',
                        show: true,
                        high: true,
                        go: false
                    };
                }
                if (_.includes(expData.THROW_idxs, idx)) {
                    return {
                        show: false,
                        type: '0'
                    };
                }

                return {
                    img: stim.StimName,
                    type: '99', // default - neutral
                    show: true,
                    go: true, //false
                    high: false
                };
            });

        _.remove(trainingStimuli, function (stim) {
            return !stim.show
        });

        expData.trainingStimuli = trainingStimuli;

        var ladderHi = 750; // TODO - change to parameter
        var ladderLow = 750;
        var CurrentHighLadder = function () {
            return _.max([0, _.min([ladderHi, 910])]);
        };
        var CurrentLowLadder = function () {
            return _.max([0, _.min([ladderLow, 910])]);
        };

        var timeline = [];
        timeline.push({
            type: 'instructions',
            pages: [
                'Training stage!'
            ],
            show_clickable_nav: true,
            allow_keys: false
        });
        var trainingResult = {};
        trainingResult.runs = [];

        for (var i = 0; i < expData.trainingRuns; i++){
            var runSuffle = _.shuffle(trainingStimuli);
            var runData = { trials: [] };
            trainingResult.runs.push(runData);

            _.each(runSuffle, function (stim) {
                var trialResult = {};
                if (!stim.go) {
                    timeline.push({
                        type: 'single-stim',
                        stimulus: expData.resourceUrl + '/images/stimuli/' + stim.img,
                        //choices: ['X'], // no key press available for NO-GO trial
                        data: { stim: stim },
                        response_ends_trial: false,
                        timing_response: 1000,
                        on_finish: function(data){
                            trialResult.onsetTime = data.time_elapsed;
                            trialResult.shuff_trialType = data.stim.type;
                            trialResult.ladder1 = (data.stim.high) ? CurrentHighLadder() : CurrentLowLadder();
                            trialResult.ladder2 = (data.stim.high) ? CurrentHighLadder() : CurrentLowLadder();
                        }
                    }, $.extend({}, common.fixation_trial, {
                        response_ends_trial: false,
                        on_finish: function(data){
                            trialResult.fixationTime = data.time_elapsed;
                            runData.trials.push(trialResult);
                        }
                    }));
                }
                else {
                    timeline.push(
                        {
                            type: 'single-audio',
                            stimulus: audioFile,
                            prompt: '<img src="' + expData.resourceUrl + '/images/stimuli/' + stim.img + '" id="jspsych-single-stim-stimulus">',
                            choices: ['X'],
                            data: { stim: stim },
                            timing_response: 1000,
                            audio_timing: (stim.high) ? CurrentHighLadder : CurrentLowLadder,
                            on_finish: function(data){
                                trialResult.onsetTime = data.time_elapsed;
                                trialResult.shuff_trialType = data.stim.type;
                                trialResult.RT = (data.rt > 0)? data.rt : 999;
                                trialResult.ladder1 = (data.stim.high) ? CurrentHighLadder() : CurrentLowLadder();
                                if (data.key_press > 0){
                                    if (data.stim.high){
                                        ladderHi = ladderHi + 50/3;
                                    }else {
                                        ladderLow = ladderLow + 50/3;
                                    }
                                } else {
                                    if (data.stim.high){
                                        ladderHi = ladderHi - 50;
                                    }else {
                                        ladderLow = ladderLow - 50;
                                    }
                                }
                                trialResult.ladder2 = (data.stim.high) ? CurrentHighLadder() : CurrentLowLadder();
                            }
                        }, $.extend({}, common.fixation_trial, {
                            choices: ['X'],
                            response_ends_trial: false,
                            on_finish: function(data){
                                var prevTrial = jsPsych.data.getDataByTrialIndex(data.trial_index-1); //jsPsych.data.getLastTrialData();
                                if (prevTrial.key_press < 0 || prevTrial.stim.go || data.rt < 500){ // 500 ms grace period
                                    trialResult.RT = (data.rt > 0)? data.rt + 1000 : 999;
                                }
                                trialResult.fixationTime = data.time_elapsed;
                                runData.trials.push(trialResult);
                            }
                        }));
                }
            });

        }


        timeline.push({
                type: 'instructions',
                pages: [
                    'Click next to continue'
                ],
                show_clickable_nav: true
            },
            {
                type: 'call-function',
                func: function () {
                    if (!expData.is_demo) {
                        $.ajax('/exp/training', $.extend({
                                method: 'POST',
                                data: JSON.stringify(trainingResult),
                                contentType: 'application/json'
                            },
                            common.ajaxRetries(2, function () {
                                callback(null, expData);
                            })));
                    }
                    else{
                        callback(null, expData);
                    }
                }
            },
            {
                type: 'instructions',
                pages: [
                    'next stage will load shortly. Please wait...'
                ],
                show_clickable_nav: false,
                allow_keys: false
            });

        jsPsych.data.clear();
        jsPsych.pluginAPI.preloadAudioFiles([audioFile], function () {
            jsPsych.init_data({
                display_element: $($element),
                timeline: timeline,
                auto_preload: false,
                default_iti: 0,
                fullscreen: false,
                on_trial_finish: function(){
                    common.forceFullScreen();
                }
            });
        });
    }
};