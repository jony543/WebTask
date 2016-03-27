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
                $.extend(subjectData, { country: data.Q0, age: data.Q1 });
            }
        },
        {
            type: 'call-function',
            func: function(){
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
            expData.ranking_key_codes = {
                left: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(expData.ranking_keys.left),
                right: jsPsych.pluginAPI.convertKeyCharacterToKeyCode(expData.ranking_keys.right)
            };
            //expData.sortedStimuli = _.map(expData.stimuli, function (stim) { return { img: stim, rank: 0.5 }});
            //probeStage(expData);
            //secondStage(expData);
            rankingStage(expData);
        });
}

function rankingStage(expData){
    var timeline = [];
    var instructionPages = _.map(expData.instructions, function(img){
        return '<img style="max-height: 100%; max-width: 100%; height: auto;" src="/resource?path=' + img + '" />'
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
                                '<img class="leftStim" src="/stim/vis/' + l.list1[i] + '" id="jspsych-single-stim-stimulus" />' +
                                '<text class="fixationText">+</text>' +
                                '<img class="rightStim" src="/stim/vis/' + l.list2[i] + '" id="jspsych-single-stim-stimulus" />',
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
                                        '<img class="leftStim" src="/stim/vis/' + data.stim1 + '" id="jspsych-single-stim-stimulus" style="' + style1 + '"/>' +
                                        '<text class="fixationText">+</text>' +
                                        '<img class="rightStim" src="/stim/vis/' + data.stim2 + '" id="jspsych-single-stim-stimulus" style="' + style2 + '" />',
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
            var rankings = c.solve().array;
            for (var i=0; i < rankings.length; i++){
                ranking_result.items_ranking.push({
                    StimName: stimuli[i],
                    StimNum: i+1,
                    Rank: rankings[i]
                });
            }

            var rankedStimuli = [];
            for (var i = 0; i < stimuli.length; i++){
                rankedStimuli.push({
                    img: stimuli[i],
                    rank: rankings[i]
                });
            }
            var sortString = JSON.stringify(_.orderBy(rankedStimuli, 'rank', 'desc'));
            return '<p style="text-align:center; color: violet">' + sortString + '/<p>'
        }
    });

    var images = [];
    stimuli.forEach(function(stim){
        images.push('/stim/vis/' + stim);
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

            }
        });
    });
}
