// set up ======================================================================
var browserify = require('browserify-middleware');
var express  = require('express');
var app      = express();
var config = require('./app/config.js');
var port     = config.get('port') || 8080;  // set the port
var morgan = require('morgan');             // log
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)

// configuration ===============================================================
//app.use('/js/utils.js', browserify([{ './common/utils.js': {run: true}}]));
//app.use('/js/lodash.js', browserify(['lodash']));
app.use(express.static(__dirname + '/public'));          // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
//app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

// routes ======================================================================
require('./app/routes.js')(app);

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);