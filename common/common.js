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
    var list1 = [];
    var list2 = [];

    var used_ones = [];
    var retries = 0;

    var count = 0;
    var arr2 = [];

    while (count < n)
    {
        if (retries > 10) {
            arr2 = _.shuffle(arr); //_.concat(arr2, arr));
            list1 = [];
            list2 = [];
            count = 0;
            used_ones = [];
            retries = 0;
        }

        if (arr2.length < 2 ) {
            arr2 = _.shuffle(arr); //_.concat(arr2, arr));
        }

        var stim1 = arr2.pop();
        var stim2 = arr2.pop();


        if (_.findIndex(used_ones, function(item){
                return (item[0] == stim1 && item[1] == stim2) || (item[0] == stim2 && item[1] == stim1)
            }) >= 0) {
            arr2.push(stim1);
            arr2.push(stim2);
            arr2 = _.shuffle(arr2);
            retries++;
        } else {
            list1.push(stim1);
            list2.push(stim2);
            used_ones.push([stim1, stim2]);
            retries = 0;
            count++;
        }
    }

    return {
        list1: list1,
        list2: list2
    }
};

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
    var maxAttempts = opts.attempts || 3;
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
                            .done(function (data, textSstatus, xhr) {
                                resultValid = true;

                                if (xhr.status == 201) {
                                    var redirectionUrl = xhr.getResponseHeader('Location');
                                    window.location.replace(redirectionUrl);
                                }

                                if (typeof(opts.cb) == "function"){
                                    opts.cb(data, textSstatus, xhr);
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
