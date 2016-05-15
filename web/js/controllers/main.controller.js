'use strict';
var $ = require('jquery');
var angular = require('angular');
var jsPsych = require('jspsych');

module.exports = function($scope, experimentService) {
    $scope.message = experimentService.getSomething();

    var welcome_block = {
        type: 'text',
        text: 'Welcome aboard. Press any key...'
    };

    //experimentService.getStimuli().then(function(response){
    //
    //});

    var timeline = [];
    timeline.push(welcome_block);

    angular.element(document).ready(function () {
        //var boost_fractals = require('../../js/experiments/boost_fractals');
        //boost_fractals.run();
        jsPsych.init({
            display_element: $('#jspsych-target'),
            timeline: timeline,
            fullscreen: false,
            on_finish: function() {
                jsPsych.data.displayData();
            }
        });
    });

        //// when landing on the page, get all todos and show them
        //$http.get('/api/todos')
        //    .success(function(data) {
        //        $scope.todos = data;
        //    })
        //    .error(function(data) {
        //        console.log('Error: ' + data);
        //    });

        //// when submitting the add form, send the text to the node API
        //$scope.createTodo = function() {
        //    $http.post('/api/todos', $scope.formData)
        //        .success(function(data) {
        //            $scope.formData = {}; // clear the form so our user is ready to enter another
        //            $scope.todos = data;
        //        })
        //        .error(function(data) {
        //            console.log('Error: ' + data);
        //        });
        //};

        //// delete a todo after checking it
        //$scope.deleteTodo = function(id) {
        //    $http.delete('/api/todos/' + id)
        //        .success(function(data) {
        //            $scope.todos = data;
        //        })
        //        .error(function(data) {
        //            console.log('Error: ' + data);
        //        });
        //};

    };