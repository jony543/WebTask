'use strict';
var $ = require('jquery');
var angular = require('angular');
var common = require('../../../common/common');
var _ = require('lodash');

module.exports = function($scope, $location, experimentService, expData, nextState) {
    // set default expData
    if (!expData)
        expData = experimentService.expData;


};