'use strict';

module.exports = function($http) {
    this.getSomething = function(){
        return 'something1';
    };

    this.getStimuli = function(){
        return $http.get('/stimuli/vis/');
    };
};