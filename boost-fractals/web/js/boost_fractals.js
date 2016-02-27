var $ = require('jquery');
if (typeof window !== "undefined"){
    window.$ = $;
}
var _ = require('lodash');
var jsPsych = require('jspsych');
var async = require('async');
var colley = require('colley-rankings');
var common = require ('../../common/common')

$(document).ready(function (){

});

$.post('/exp/init', { name: "test_subject" })
    .done(function( result ) {
        result.sortedStimuli = result.stimuli;
        secondStage(result);
        //rankingStage(result);
    });

function rankingStage(expData){
    var stimuli = expData.stimuli;

    var l = common.createRandomCompetitions(stimuli, expData.rankingTrials);

    var competitions_stimuli = [];
    for (var i = 0; i < l.list1.length; i++){
        competitions_stimuli.push(common.fixation_trial,
            {
                data:{
                    stim1: l.list1[i],
                    stim2: l.list2[i],
                    nStim: _.indexOf(stimuli, l.list1[i]),
                    nStim2: _.indexOf(stimuli, l.list2[i])
                },
                stimulus:
                '<img src="/stim/vis/' + l.list1[i] + '" id="jspsych-single-stim-stimulus" style="float: left; width: 350px;">' +
                '<img src="/stim/vis/' + l.list2[i] + '" id="jspsych-single-stim-stimulus" style="float: right; width: 350px;">'
            });
    }

    var rankingKeys = { left: 'Z', right: 'X'};
    var rankingKeyCodes = {
        left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(rankingKeys.left),
        right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(rankingKeys.right)
    };

    var c = colley(stimuli.length);

    var ranking_result = {};
    ranking_result.trials = [];
    ranking_result.items_ranking = [];
    ranking_result.trial_count = 0;

    var rankingTrials = {
        type: 'single-stim',
        choices: [rankingKeys.left, rankingKeys.right],
        timing_response: 1500,
        is_html: true,
        timeline: competitions_stimuli,
        on_finish: function(data){
            var selected = '';

            if (rankingKeyCodes.left == data.key_press){
                selected = 'stim1';
                c.addGame(data.nStim1, data.nstim2);
            }else{
                c.addGame(data.nStim2, data.nStim1);
            }
            jsPsych.data.addDataToLastTrial({selected: selected});

            ranking_result.trial_count = ranking_result.trial_count + 1;
            ranking_result.trials.push({
                runtrial: ranking_result.trial_count,
                onsettime: data.time_elapsed,
                ImageLeft: data.stim1,
                ImageRight: data.stim2,
                StimNumLeft: data.nStim1,
                StimNumRight: data.nStim2,
                out: 2,
                RT: data.rt
            });
        }
    };

    var timeline = [];
    timeline.push(rankingTrials);

    var images = [];
    stimuli.forEach(function(stim){
        images.push('/stim/vis/' + stim);
    });

    jsPsych.pluginAPI.preloadImages(images, function(){
        jsPsych.init({
            display_element: $('#jspsych-target'),
            timeline: timeline,
            fullscreen: false,
            default_iti: 0,
            on_finish: function() {
                //jsPsych.data.displayData();
                var rankings = c.solve().array;
                for (var i=0; i < rankings.length; i++){
                    ranking_result.items_ranking.push({
                        StimName: stimuli[i],
                        StimNum: i+1,
                        Rank: rankings[i]
                    });
                }
                $.ajax('/exp/rankings', { method: 'POST', data: ranking_result, tryCount: 0, retryLimit: 5 })
                    .fail(function() {
                            this.tryCount++;
                            if (this.tryCount <= this.retryLimit) {
                                //try again
                                $.ajax(this);
                                return;
                            }else{
                                // fatal error
                                jsPsych.endExperiment('A fatal error was encountered. The experiment was ended.');
                            }
                    });

                var rankedStimuli = [];
                for (var i = 0; i < stimuli.length; i++){
                    rankedStimuli.push({
                        stim: stimuli[i],
                        rank: rankings[i]
                    });
                }
                expData.sortedStimuli = _.sortBy(rankedStimuli, 'rank');

                secondStage(expData);
            }
        });
    });
}

function secondStage(expData) {
    //var LV_GO_stimuli = _.at(expData.sortedStimuli, expData.LV_GO_idxs);
    //var LV_NOGO_stimuli = _.at(expData.sortedStimuli, expData.LV_NOGO_idxs);
    //var HV_GO_stimuli = _.at(expData.sortedStimuli, expData.HV_GO_idxs);
    //var HV_NOGO_stimuli = _.at(expData.sortedStimuli, expData.HV_NOGO_idxs);

    var trainingStimuli =
        _.map(expData.sortedStimuli, function (stim, idx) {
            if (_.includes(expData.LV_GO_idxs, idx)) {
                return {
                    img: stim,
                    type: '22',
                    show: true,
                    high: false,
                    go: true
                };
            }
            if (_.includes(expData.LV_NOGO_idxs, idx)) {
                return {
                    img: stim,
                    type: '24',
                    show: true,
                    high: false,
                    go: false
                };
            }
            if (_.includes(expData.HV_GO_idxs, idx)) {
                return {
                    img: stim,
                    type: '11',
                    show: true,
                    high: true,
                    go: true
                };
            }
            if (_.includes(expData.HV_NOGO_idxs, idx)) {
                return {
                    img: stim,
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
                img: stim,
                type: '99', // default - neutral
                show: true,
                go: true, //false
                high: false
            };
        });

    _.remove(trainingStimuli, function (stim) {
        return !stim.show
    });

    var ladderHi = 700;
    var ladderLow = 700;
    var CurrentHighLadder = function () {
        return _.max([0, _.min([ladderHi, 910])]);
    };
    var CurrentLowLadder = function () {
        return _.max([0, _.min([ladderLow, 910])]);
    };

    var timeline = [];
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
                    stimulus: '/stim/vis/' + stim.img,
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
                    choices: ['X'],
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
                    stimulus: '/resources/boost_fractals/sound.wav',
                    prompt: '<img src="/stim/vis/' + stim.img + '" id="jspsych-single-stim-stimulus">',
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
                        }else {
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
                            var prevTrial = jsPsych.data.getLastTrialData();
                            if (prevTrial.key_press < 0){
                                trialResult.RT = (data.rt > 0)? data.rt + 1000 : 999;
                            }
                            trialResult.fixationTime = data.time_elapsed;
                            runData.trials.push(trialResult);
                        }
                    }));
            }
        });

    }

    jsPsych.init({
        display_element: $('#jspsych-target'),
        timeline: timeline,
        default_iti: 0,
        fullscreen: false,
        on_finish: function() {
            $.ajax('/exp/training', $.extend({ method: 'POST', data: trainingResult }, common.ajaxRetries(2, function() {
                jsPsych.endExperiment('A fatal error was encountered. The experiment was ended.');
            })));
            jsPsych.data.displayData();
            console.log(trainingResult);
        }
    });
}

module.exports.func1 = function(){ console.log('1 1 2 3 5 8 13 21 34 55 89'); };

