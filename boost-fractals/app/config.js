var nconf = require('nconf');
var fs = require('fs');

var baseConfig = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
nconf.overrides(baseConfig);

nconf.argv()
    .env()
    .file({
        file: './config/' + process.env.ENVIRONMENT + '/config.json'
    });

nconf.defaults(baseConfig);

nconf.use('memory');

module.exports = nconf;