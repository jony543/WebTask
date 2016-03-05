'use strict'

var _ = require('lodash');
var $ = require('jquery');

module.exports.createRandomCompetitions = function (arr, n){
    var random_competitions = _.sampleSize(array_choose_k(arr,2),n);

    var list1 = [];
    var list2 = [];

    _.each(random_competitions, function(couple){
        var shuffled = _.shuffle(couple);
        list1.push(shuffled[0]);
        list2.push(shuffled[1]);
    });

    return {
        list1: list1,
        list2: list2
    }
};

function array_choose_k(arr, k){
    var i, j, combs, head, tailcombs;

    if (k > arr.length || k <= 0) {
        return [];
    }

    if (k == arr.length) {
        return [arr];
    }

    if (k == 1) {
        combs = [];
        for (i = 0; i < arr.length; i++) {
            combs.push([arr[i]]);
        }
        return combs;
    }

    // 1 < k < arr.length
    combs = [];
    for (i = 0; i < arr.length - k + 1; i++) {
        head = arr.slice(i, i+1);
        tailcombs = array_choose_k(arr.slice(i + 1), k - 1);
        for (j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]));
        }
    }
    return combs;
}

module.exports.getAllCompetitions = function (arr1, arr2, data){
    var l = [];
    _.forEach(arr1, function (a){
        _.forEach(arr2, function(b){
            var shuffled = _.shuffle([a, b]);
            l.push($.extend({
                left: shuffled[0],
                right: shuffled[1]
            }, data));
        });
    });
    return l;
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
            } else {
                // fatal error
                if (typeof(cb) == "function"){
                    cb();
                }
            }
        }
    };
};
