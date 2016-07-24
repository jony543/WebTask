'use strict';
var app = require('angular').module('experimentApp');

app.controller('mainController', require('./main.controller.js'));
app.controller('boostFractalsController', require('./boost.fractals.controller'));
app.controller('welcomeController', require('./welcome.controller.js'));
app.controller('rankingStageController', require('./ranking.stage.controller.js'));
app.controller('sliderRankingController', require('./slider.ranking.controller.js'));
app.controller('finalSurveyController', require('./final.survey.controller.js'));