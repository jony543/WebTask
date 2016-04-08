var config = require('./config')
var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var _ = require('lodash');
var json2csv = require('json2csv');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

function generateSessionId(){
    var rnd = crypto.randomBytes(16);
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    rnd = rnd.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
    rnd.shift();
    return rnd.join('-');
}

module.exports = function (app) {
    // browser routes
    app.get('/fractals', function (req, res) {
        //TODO - move to serve static middleware
        res.sendFile(path.normalize(__dirname + '/../public/views/boost_fractals2.html'));
    });

    // api
    app.post('/exp/init', function (req, res) {
        var expData = config.get('expData');
        var exp_name = 'midgam_binary_rankings';

        if (!req.session.id) {
            req.session.id = generateSessionId();
        }
        req.session.exp = exp_name;
        req.session.dt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        req.session.subject = req.body; // TODO - validate user input
        req.session.stage = 1;

        var sessionDir = exp_name + '/output/' + req.session.dt + '_' + req.session.id;
        req.session.dir = sessionDir;

        return res.send(expData);
    });

    app.post('/exp/rankings', function (req, res) {
        if (!req.session.subject) {
            return res.sendStatus(httpStatus.FORBIDDEN);
        }

        async.parallel([
            function (callback){
                json2csv({
                    data: req.body.trials,
                    fields: [ { value: 'subjectId', default: req.session.id }, 'runtrial', 'onsettime', 'ImageLeft', 'ImageRight', 'StimNumLeft', 'StimNumRight', 'RT'],
                    quotes: ''
                },
                function(err, csv) {
                    if (err) {
                        return callback(err, null);
                    }

                    s3.upload({
                        Bucket: config.get('aws:s3Bucket'),
                        Key: req.session.dir + '/ranking_result.csv',
                        Body: csv
                    }, function(err, data){
                        if (err){
                            return callback(err, data);
                        }
                        return callback(null, data);
                    });
                });
            },
            function (callback){
                json2csv({
                    data: req.body.items_ranking,
                    fields: [ { value: 'subjectId', default: req.session.id }, 'StimName', 'StimNum', 'Rank'],
                    quotes: ''
                },
                function(err, csv) {
                    if (err) {
                        return callback(err, null);
                    }

                    s3.upload({
                        Bucket: config.get('aws:s3Bucket'),
                        Key: req.session.dir + '/ItemsRankingResult.csv',
                        Body: csv
                    }, function(err, data){
                        if (err){
                            return callback(err, data);
                        }
                        return callback(null, data);
                    });
                });
            }
        ],
        function(err, data){
            if (req.session.subject != undefined && req.session.subject.midgam_id != undefined){
                req.session = null;
                return res.redirect('https://www.midgampanel.com/surveyThanks2.asp?USER=' + req.session.subject.midgam_id + '&status=OK');
            }

            if (err){
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }else{
                // TODO - destroy session here?
                return res.sendStatus(httpStatus.OK);
            }
        });
    });
};
