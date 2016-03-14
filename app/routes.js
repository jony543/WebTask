var config = require('./config')
var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');
var json2csv = require('json2csv');

module.exports = function (app) {
    // browser routes
    app.get('/boost_fractals', function (req, res) {
        res.sendfile('./public/views/boost_fractals2.html');
    });

    // api
    app.get('/stim/vis/:name', function (req, res) {
        res.sendFile(path.normalize(__dirname + '/../public/resources/' + 'boost_fractals' + '/stimuli/images/' + req.params.name));
    });

    app.post('/exp/init', function (req, res) {
        var exp_name = 'boost_fractals';

        req.session.exp = exp_name;
        req.session.subject = req.body; // TODO - validate user input
        req.session.stage = 1;

        var sessionDir = './output/user_' + req.session.id;
        req.session.dir = sessionDir;
        if (!fs.existsSync(sessionDir)){
            fs.mkdirSync(sessionDir);
        }

        fs.readdir('./public/resources/' + exp_name + '/stimuli/images/', function(err, files){
            if (err){
                return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }

            var expData = config.get('defaults:expData');
            expData.stimuli = files;

            return res.send(expData);
        });
    });

    app.post('/exp/rankings', function (req, res) {
        if (!req.session.subject) {
            return res.sendStatus(httpStatus.FORBIDDEN);
        }

        json2csv({
            data: req.body.trials,
            fields: [ { value: 'subjectId', default: req.session.id }, 'runtrial', 'onsettime', 'ImageLeft', 'ImageRight', 'StimNumLeft', 'StimNumRight', 'RT'],
            quotes: ''
        }, function(err, csv) {
            if (err) {
                console.log(err);
            }
            fs.writeFile(req.session.dir + '/rankings_result.csv', csv);
        });

        return res.sendStatus(httpStatus.OK);
    });
};