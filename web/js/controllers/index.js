'use strict';
var app = require('angular').module('experimentApp');

app.controller('welcomeController', ['$scope', '$location', '$routeParams', 'experimentService', 'nextState',
    require('./welcome.controller.js')]);

app.controller('rankingStageController', ['$scope', '$location', 'experimentService', 'expData', 'nextState',
    require('./ranking.stage.controller.js')]);

app.controller('sliderRankingController', ['$scope', '$location', 'experimentService', 'expData', 'nextState',
    require('./slider.ranking.controller.js')]);

app.controller('finalSurveyController', ['$scope', '$location', 'experimentService', 'expData', 'nextState',
    require('./final.survey.controller.js')]);