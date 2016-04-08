// set up ======================================================================
var express  = require('express');
var app      = express();
var session = require('cookie-session'); // require('express-session');

////set up redis
//var redisStore = require('connect-redis')(session);
//var redis   = require("redis");
//var client  = redis.createClient(15029, 'ec2-54-235-164-4.compute-1.amazonaws.com', { no_ready_check: true });
//client.auth('pd0jkt9g0uhivq9u1evc3fbn8qt', function (err) {
//    if (err) {
//        throw err;
//    }
//});

var config = require('./app/config.js');
var port     = process.env.PORT || config.get('port') || 8080;  // set the port
var morgan = require('morgan');             // log
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)

process.env.PWD = process.cwd();

// configuration ===============================================================
app.use(session({
    name: 'session',
    keys: ['key12345'],
    cookie: {
        //secure: true,
        httpOnly: true,
        //domain: 'example.com',
        //path: 'foo/bar',
        //expires: expiryDate,
        maxAge: 1000*60*60*2 // 2 hours in milliseconds
    }
    //secret: 'this is the secret to be use with !schonberglab% application. fock off.',
    //store: new redisStore({ client: client, ttl : 60*60*1 }),
    //saveUninitialized: false,
    //resave: false
}));

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