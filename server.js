// set up ======================================================================
var express  = require('express');
var app      = express();

var session = require('express-session');

var redisStore = require('connect-redis')(session);
var redis   = require("redis");
var client  = redis.createClient(11882, 'pub-redis-11882.eu-central-1-1.1.ec2.redislabs.com', { no_ready_check: true });
client.auth('schonberg01', function (err) {
    if (err) {
        throw err;
    }
});

var config = require('./app/config.js');
var port     = process.env.PORT || config.get('port') || 8080;  // set the port
var morgan = require('morgan');             // log
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)

process.env.PWD = process.cwd();

// configuration ===============================================================

//var dynamoDBOptions = {
//    // Name of the table you would like to use for sessions.
//    // Defaults to 'sessions'
//    table: 'midgam-sessions',
//
//    // Optional path to AWS credentials (loads credentials from environment variables by default)
//    // AWSConfigPath: './path/to/credentials.json',
//
//    // Optional JSON object of AWS configuration options
//    // AWSConfigJSON: {
//    //     region: 'us-east-1',
//    //     correctClockSkew: true
//    // }
//
//    // Optional. How often expired sessions should be cleaned up.
//    // Defaults to 600000 (10 minutes).
//    reapInterval: 60*60*1
//};
//DynamoDBStore = require('connect-dynamodb')({ session: session });
//app.use(session({
//    store: new DynamoDBStore(dynamoDBOptions),
//    secret: 'keyboard cat',
//    resave: false,
//    saveUninitialized: false
//}));

app.use(session({
    secret: 'this is the secret to be use with !schonberglab% application. fock off.',
    store: new redisStore({ client: client, ttl : 60*60*1 }),
    saveUninitialized: false,
    resave: false
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