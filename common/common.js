'use strict'

var _ = require('lodash');
var $ = require('jquery');

module.exports.getQueryParams = function () {
    // This function is anonymous, is executed immediately and
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
};

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
    stimulus: ['<p style="font-size: 100px; text-align:center; color: white">+</p>'],
    is_html: true,
    timing_response: 1000, // how long to show the fixation for
    choices: 'none',       // don't allow any responses from the subject
    timing_post_trial: 0
};

module.exports.waitForServerResponseTrial = function(url, opts){
    var payload = opts.data || {};
    var isSending = false;
    var resultValid = false;
    var maxAttempts = opt.attempts || 3;
    var attemptsCount = 0;
    return {
        timeline: [
            {
                type: 'call-function',
                func: function(){
                    if (!isSending) {
                        isSending = true;
                        attemptsCount++;
                        $.ajax({
                                url: url, //'http://localhost:8081' + url,
                                method: 'POST',
                                data: JSON.stringify(payload),
                                contentType: 'application/json'
                            })
                            .done(function (data) {
                                resultValid = true;
                                if (typeof(opts.cb) == "function"){
                                    opts.cb(data);
                                }
                            })
                            .fail(function( jqXHR, textStatus, errorThrown ) {
                                console.log('failed submitting results to: ' + url + '. ' + errorThrown)
                            })
                            .always(function(){
                                isSending = false;
                            });
                    }
                }
            },
            {
                type: 'single-stim',
                stimulus: opts.waitText || 'Loading. Please wait...',
                is_html: true,
                timing_response: opts.retry_interval || 2000
            }
        ],
        loop_function: function (){
            return !resultValid && attemptsCount < maxAttempts;
        }
    };
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

module.exports.forceFullScreen = function () {
    if (screen.width == window.innerWidth && screen.height == window.innerHeight) {
        // user is already in full screen
        return true;
    } else {
        // Supports most browsers and their versions.
        var element = document.body;
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

        if (requestMethod) { // Native full screen.
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }

        return false;
    }
};
