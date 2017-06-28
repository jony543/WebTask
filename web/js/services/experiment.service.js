'use strict';

module.exports = function($http) {
    this.resourcesUrl = "";

    this.expData = undefined;
    this.demoData = undefined;
    this.expData2 = undefined;

    this.getMessage = function(){
        return 'something1';
    };

    this.setResourcesUrl = function(url){
        this.resourcesUrl = url;
    };

    this.initExperiment = function(subjectData){
        return $http.post('/exp/init', subjectData);
    };

    this.getExpData2 = function(){
        return $http.get(this.resourcesUrl + '/expData2.json',
            {
            });
    };

    this.getExpData = function(){
        return $http.get(this.resourcesUrl + '/expData.json',
            {
            });
    };

    this.getDemoData = function(){
        return $http.get(this.resourcesUrl + '/demoData.json',
            {
            });
    };


};