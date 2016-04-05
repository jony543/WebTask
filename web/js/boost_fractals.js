var $ = require('jquery');
if (typeof window !== "undefined"){
    window.$ = $;
}
var _ = require('lodash');
var jsPsych = require('jspsych');
var async = require('async');
var colley = require('colley-rankings');
var common = require ('../../common/common');


$(document).ready(function (){
    welcome();
});

function welcome(){
    var timeline = [];
    var subjectData = {};
    timeline.push(
        {
            type: 'instructions',
            pages: [
                'Welcome to the experiment. Click next to begin.'
                //'This is the second page of instructions.',
                //'This is the final page.'
            ],
            show_clickable_nav: true
        },
        {
            type: 'survey-text',
            questions: ["Where are you from?", "How old are you?"],
            rows: [5,3],
            columns: [40,50]
        },
        {
            type: 'call-function',
            func: function(){
                var data = jsPsych.data.getLastTrialData();
                var params =  common.getQueryParams();
                var midgamId = params.user || params.USER || params.User;
                $.extend(subjectData, { country: data.Q0, age: data.Q1, midgam_id: midgamId });
                startExperiment(subjectData);
            }
        },
        {
            type: 'instructions',
            pages: [
                'The experiment will load shortly. Please wait...'
            ],
            show_clickable_nav: false,
            allow_keys: false
        });
    jsPsych.init({
        display_element: $('#jspsych-target'),
        auto_preload: false,
        timeline: timeline,
        fullscreen: false,
        default_iti: 0,
        on_trial_finish: function(){
            common.forceFullScreen();
        }
    });
}

function startExperiment(subjectData) {
    $.ajax('/exp/init',{ method: 'POST', data: JSON.stringify(subjectData), contentType: 'application/json' })
        .done(function (expData) {
            $.ajax(expData.resourceUrl + '/expData.json', { dataType: 'jsonp', jsonp: false, jsonpCallback: 'content' })
                .done(function (json){
                    $.extend(expData, json);
                    expData.ranking_key_codes = {
                        left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(expData.ranking_keys.left),
                        right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(expData.ranking_keys.right)
                    };
                    //expData.sortedStimuli = _.map(expData.stimuli, function (stim) { return { img: stim, rank: 0.5 }});
                    //probeStage(expData);
                    //secondStage(expData);
                    rankingStage(expData);
                });
        });
}

function rankingStage(expData){
    var timeline = [];
    var instructionPages = _.map(expData.instructions, function(img){
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

    var l = common.createRandomCompetitions(stimuli, expData.rankingTrials);

    var c = colley(stimuli.length);

    var ranking_result = {};
    ranking_result.trials = [];
    ranking_result.items_ranking = [];
    ranking_result.trial_count = 0;

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
                                '<img class="leftStim" src="' + expData.resourceUrl + '/images/stimuli/' + l.list1[i] + '" id="jspsych-single-stim-stimulus" />' +
                                '<text class="fixationText">+</text>' +
                                '<img class="rightStim" src="' + expData.resourceUrl + '/images/stimuli/' + l.list2[i] + '" id="jspsych-single-stim-stimulus" />',
                        on_finish: function (data) {
                            if (data.key_press > 0) {
                                if (expData.ranking_key_codes.left == data.key_press) {
                                    c.addGame(data.nStim1, data.nStim2);
                                } else {
                                    c.addGame(data.nStim2, data.nStim1);
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
                                var prevTrialTime = _.min([prevTrial.rt, expData.ranking_rt])
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

    timeline.push({
        type: 'instructions',
        pages: [
            'Ranking stage!'
        ],
        show_clickable_nav: true,
        allow_keys: false
    });

    timeline.push(rankingTrials);

    timeline.push({
        type: 'call-function',
        func: function(){
            var rankings = c.solve().array;
            var stimuli_ranking = [];
            for (var i=0; i < rankings.length; i++){
                stimuli_ranking.push({
                    StimName: stimuli[i],
                    StimNum: i+1,
                    Rank: rankings[i]
                });
            }
            ranking_result.items_ranking = _.orderBy(stimuli_ranking,'Rank','desc')
        }
    });

    timeline.push(common.waitForServerResponseTrial('/exp/rankings',
    {
        data: ranking_result,
        waitText: 'Loading next stage...',
        retry_interval: 2000
    }));

    timeline.push({
        type: 'single-stim',
        is_html: true,
        stimulus: '<p style="font-size: 32px; text-align:center; color: violet">Thank you :)</p>'
    });

    timeline.push({
        type: 'single-stim',
        is_html: true,
        stimulus: function(){

            var rankedStimuli = [];
            for (var i = 0; i < stimuli.length; i++){
                rankedStimuli.push({
                    img: stimuli[i],
                    rank: ranking_result.items_ranking[i]
                });
            }

            expData.sorted_stimuli = _.orderBy(rankedStimuli, 'rank', 'desc');
            var sortString = JSON.stringify(expData.sorted_stimuli);
            return '<p style="text-align:center; color: violet">' + sortString + '/<p>'
        }
    });

    var images = [];
    stimuli.forEach(function(stim){
        images.push(expData.resourceUrl + '/images/stimuli/' + stim);
    });

    jsPsych.pluginAPI.preloadImages(images, function(){
        jsPsych.data.clear();
        jsPsych.init({
            display_element: $('#jspsych-target'),
            auto_preload: false,
            timeline: timeline,
            fullscreen: false,
            default_iti: 0,
            on_trial_finish: function(){
                common.forceFullScreen();
            },
            on_finish: function() {
                //secondStage(expData);
            }
        });
    });
}

function secondStage(expData) {
    var trainingStimuli =
        _.map(expData.sortedStimuli, function (stim, idx) {
            if (_.includes(expData.LV_GO_idxs, idx)) {
                return {
                    img: stim.img,
                    type: '22',
                    show: true,
                    high: false,
                    go: true
                };
            }
            if (_.includes(expData.LV_NOGO_idxs, idx)) {
                return {
                    img: stim.img,
                    type: '24',
                    show: true,
                    high: false,
                    go: false
                };
            }
            if (_.includes(expData.HV_GO_idxs, idx)) {
                return {
                    img: stim.img,
                    type: '11',
                    show: true,
                    high: true,
                    go: true
                };
            }
            if (_.includes(expData.HV_NOGO_idxs, idx)) {
                return {
                    img: stim.img,
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
                img: stim.img,
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
                        stimulus: '/resources/boost_fractals/sound.wav',
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

    jsPsych.data.clear();
    jsPsych.init({
        display_element: $('#jspsych-target'),
        timeline: timeline,
        auto_preload: false,
        default_iti: 0,
        fullscreen: false,
        on_finish: function() {
            $.ajax('/exp/training', $.extend({ method: 'POST', data: trainingResult, contentType: 'application/json' }, common.ajaxRetries(2, function() {
                //jsPsych.endExperiment('A fatal error was encountered. The experiment was ended.');
                //alert('failed /exp/training');
            })));
            //jsPsych.data.displayData();
            console.log(trainingResult);
            probeStage(expData);
        }
    });
}

function probeStage(expData){
    var LV_GO_stimuli = _.filter(expData.trainingStimuli, function(stim){ return stim.high && stim.go });
    var LV_NOGO_stimuli = _.filter(expData.trainingStimuli, function(stim){ return stim.high && !stim.go });

    var HV_GO_stimuli = _.filter(expData.trainingStimuli, function(stim){ return !stim.high && stim.go });
    var HV_NOGO_stimuli = _.filter(expData.trainingStimuli, function(stim){ return !stim.high && !stim.go });

    var HV_SANITY = _.at(expData.sortedStimuli, expData.HV_SANITY);
    var LV_SANITY = _.at(expData.sortedStimuli, expData.LV_SANITY);

    var competitions = []
        .concat(common.getAllCompetitions(LV_GO_stimuli, LV_NOGO_stimuli, { pairType: 2 }))
        .concat(common.getAllCompetitions(HV_GO_stimuli, HV_NOGO_stimuli, { pairType: 1 }))
        .concat(common.getAllCompetitions(HV_SANITY, LV_SANITY, { pairType: 4 }));

    var timeline = [];
    timeline.push({
        type: 'instructions',
        pages: [
            'Probe stage!'
        ],
        show_clickable_nav: true,
        allow_keys: false
    });
    var probeResult = { blocks: [] };

    for (var i = 0; i < expData.probeBlocks; i++){
        var blockCompetitions = _.shuffle(competitions);
        var blockResult = { num: i+1, trial_count: 0, trials: [] };
        _.each(blockCompetitions, function (stimuli){
            timeline.push({
                timeline: [
                    {
                        type: 'single-stim',
                        choices: [expData.ranking_keys.left, expData.ranking_keys.right],
                        timing_response: expData.ranking_rt,
                        is_html: true,
                        data: {
                            stim1: stimuli.left.img,
                            stim2: stimuli.right.img,
                            nStim1: _.indexOf(expData.stimuli, stimuli.left.img),
                            nStim2: _.indexOf(expData.stimuli, stimuli.right.img),
                            pairType: stimuli.pairType
                        },
                        stimulus:
                        '<div style="margin-top: 170px">' +
                        '<img src="/stim/vis/' + stimuli.left.img + '" id="jspsych-single-stim-stimulus" style="float: left; width: 350px;">' +
                        '<text style="font-size: 100px; text-align:center; color: white; position: absolute; margin-top: 110px; margin-left: 20px;">+</text>' +
                        '<img src="/stim/vis/' + stimuli.right.img + '" id="jspsych-single-stim-stimulus" style="float: right; width: 350px;"></div>',
                        on_finish: function (data) {
                            var out;
                            if (jsPsych.pluginAPI.convertKeyCharacterToKeyCode(expData.ranking_key_codes.left) == data.key_press) {
                                if (data.stim1.go && !data.stim2.go){ out = 1; } else { out = 0; }
                            }
                            else
                            {
                                if (!data.stim1.go && data.stim2.go){ out = 1; } else { out = 0; }
                            }

                            blockResult.trial_count = blockResult.trial_count + 1;
                            blockResult.trials.push({
                                trialnum: blockResult.trial_count,
                                onsettime: data.time_elapsed,
                                pairtType: data.pairType,
                                ImageLeft: data.stim1,
                                ImageRight: data.stim2,
                                StimNumLeft: data.nStim1,
                                StimNumRight: data.nStim2,
                                out: out,
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
                                '<p style="font-size: 100px; text-align:center;">+</p>'],
                            is_html: true,
                            timing_stim: [500, -1],
                            timing_response: function () {
                                var prevTrial = jsPsych.data.getLastTrialData();
                                var prevTrialTime = _.min([prevTrial.rt, expData.probe_rt])
                                return expData.probe_trial_time - prevTrialTime;
                            },
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
                                        style1 = 'border: solid 5px green; margin: -5px;';
                                    } else {
                                        style2 = 'border: solid 5px green; margin: -5px;';
                                    }

                                    return [
                                        '<div style="margin-top: 170px">' +
                                        '<img src="/stim/vis/' + data.stim1 + '" id="jspsych-single-stim-stimulus" style="float: left; width: 350px;' + style1 + '">' +
                                        '<text style="font-size: 100px; text-align:center; color: white; position: absolute; margin-top: 110px; margin-left: 20px;">+</text>' +
                                        '<img src="/stim/vis/' + data.stim2 + '" id="jspsych-single-stim-stimulus" style="float: right; width: 350px;' + style2 + '"></div>',
                                        '<p style="font-size: 100px; text-align:center;">+</p>',
                                        '<p style="font-size: 100px; text-align:center;">+</p>'
                                    ];
                                },
                                is_html: true,
                                timing_stim: [500, -1],
                                timing_response: function () {
                                    var prevTrial = jsPsych.data.getLastTrialData();
                                    var prevTrialTime = _.min([prevTrial.rt, expData.probe_rt])
                                    return expData.probe_trial_time - prevTrialTime;
                                }
                            }
                        ]
                    }]
            });
        });
        probeResult.blocks.push(blockResult);
    }

    timeline.push({
        type: 'single-stim',
        is_html: true,
        stimulus: '<p style="font-size: 32px; text-align:center; color: violet">Thank you :)</p>'
    });

    jsPsych.data.clear();

    jsPsych.init({
        display_element: $('#jspsych-target'),
        auto_preload: false,
        timeline: timeline,
        fullscreen: false,
        default_iti: 0,
        on_finish: function() {
            $.ajax('/exp/probe', $.extend({ method: 'POST', data: probeResult, contentType: 'application/json' }, common.ajaxRetries(2, function() {
                //jsPsych.endExperiment('A fatal error was encountered. The experiment was ended.');
                //alert('failed /exp/probe');
            })));
        }
    });
}

//module.exports.func1 = function(){ console.log('1 1 2 3 5 8 13 21 34 55 89'); };
