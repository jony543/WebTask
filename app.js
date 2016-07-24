// set up ======================================================================
var express  = require('express');
var app      = express();
var session = require('cookie-session'); // require('express-session');
var config = require('./app/config.js');
var port     = process.env.PORT || config.get('port') || 8080;  // set the port
var winston = require('winston');
var expressWinston = require('express-winston');
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var url = require('url');

process.env.PWD = process.cwd();

// configuration ===============================================================
app.use(helmet());

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        })
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    //msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    //expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true
    colorStatus: true // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true
}));

app.use(cookieParser());
app.use(session({
    name: 'session',
    keys: ['key12345'],
    cookie: {
        httpOnly: true,
        maxAge: 1000*60*60*2 // 2 hours in milliseconds
    }
}));

app.use(express.static(process.env.PWD + '/public'));          // set the static files location /public/img will be /img for users
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.urlencoded({ extended: true }));            // parse application/x-www-form-urlencoded
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

// routes ======================================================================
require('./app/routes.js')(app);

// default route
app.use(function(req, res){
    var urlParts = url.parse(req.url);
    var urlQuery = urlParts.search || (urlParts.query) ? '?' + urlParts.query : '';
    res.redirect('/' + urlQuery);
});

// error logger ================================================================
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: false,
            colorize: true
        })
    ]
}));

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("App listening on port " + port);