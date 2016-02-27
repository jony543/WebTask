'use strict'

var _ = require('lodash');
var $ = require('jquery');

module.exports.createRandomCompetitions = function (arr, n){
    var list1 = [];
    var list2 = [];
    var tempArr = [];

    while (list1.length < n){
        if (tempArr.length < 2){
            tempArr = _.concat(tempArr, arr);
        }
        var sample = _.sampleSize(tempArr, 2);
        list1.push(sample[0]);
        list2.push(sample[1]);

        // TODO - implement unique competitions


        _.remove(tempArr, function(item){
            return _.includes(sample,item);
        });
    }

    return {
        list1: list1,
        list2: list2
    }
};

module.exports.fixation_trial = {
    type: 'single-stim',
    stimulus: ['<p style="font-size: 100px; text-align:center; color: red">+</p>'],
    is_html: true,
    timing_response: 1000, // how long to show the fixation for
    choices: 'none',       // don't allow any responses from the subject
    timing_post_trial: 0
};

module.exports.ajaxRetries = function(n, cb){
    return {
        tryCount: 0,
        retryLimit: n,
        error: function(){
            this.tryCount++;
            if (this.tryCount <= this.retryLimit) {
                //try again
                $.ajax(this);
                return;
            }else{
                // fatal error
                //jsPsych.endExperiment('A fatal error was encountered. The experiment was ended.');
                if (typeof(cb) == "function"){
                    cb();
                }
            }
        }
    };
};
