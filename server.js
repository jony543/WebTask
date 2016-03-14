// set up ======================================================================
var express  = require('express');
var app      = express();

var session = require('express-session');
//var redisStore = require('connect-redis')(session);
//var redis   = require("redis");
//var client  = redis.createClient();

//var browserify = require('browserify-middleware');

var config = require('./app/config.js');
var port     = process.env.PORT || config.get('port') || 8080;  // set the port
var morgan = require('morgan');             // log
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var serveIndex = require('serve-index')

process.env.PWD = process.cwd();

// configuration ===============================================================
app.use(session({
    secret: 'this is the secret to be use with !schonberglab% application. fock off.',
    //store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl :  260}),
    saveUninitialized: false,
    resave: false
}));

if (config.get('ENVIRONMENT') == 'DEVELOPMENT'){
    //app.use('/output', express.directory(process.env.PWD + '/output'));
    app.use('/output', serveIndex('./output', { 'icons': true, 'view': 'details' }));
    app.use('/output', express.static(process.env.PWD + '/output'));
}

app.use(express.static(process.env.PWD + '/public'));          // set the static files location /public/img will be /img for users
//app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.urlencoded({ extended: true }));            // parse application/x-www-form-urlencoded
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

// routes ======================================================================
require('./app/routes.js')(app);

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);