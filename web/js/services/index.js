'use strict';

var app = require('angular').module('experimentApp');

app.service('experimentService', ['$http', require('./experiment.service')]);