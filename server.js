if (process.env.ENVIRONMENT == 'DEVELOPMENT') {
    require('./app.js');
} else {
    var forever = require('forever-monitor');

    var child = new (forever.Monitor)('app.js', {
        silent: false,
        args: [],
        'killTree': true
    });

    child.on('exit', function () {
        console.log('index.js has exited after 3 restarts');
    });

    child.start();
    console.log('index.js has started');
}