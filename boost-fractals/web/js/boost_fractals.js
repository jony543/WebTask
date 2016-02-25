var $ = require('jquery');
var jsPsych = require('jspsych');

var welcome_block = {
    type: 'text',
    text: 'Welcome aboard. Press any key...'
};

var timeline = [];
timeline.push(welcome_block);

$(document).ready(function (){
    jsPsych.init({
        display_element: $('#jspsych-target'),
        timeline: timeline,
        fullscreen: false,
        on_finish: function() {
            jsPsych.data.displayData();
        }
    });
});

