var config = require('./config');
var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var _ = require('lodash');
var json2csv = require('json2csv');
var url = require('url');

var AWS = require('aws-sdk');
AWS.config.update({region:'eu-west-1'});
var s3 = new AWS.S3();

var $db = new AWS.DynamoDB();
var DynamoDB = require('aws-dynamodb')($db);
DynamoDB.on('error', function( operation, error, payload ) {
    // you could use this to log fails into LogWatch for
    // later analysis or SQS queue lazy processing
    console.log('DynamoDB error on ' + operation + ': ' + error + '. payload: ' + payload);
});

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
    //app.get('/fractals2', function (req, res) {
    //    var urlParts = url.parse(req.url);
    //    var urlQuery = urlParts.search || (urlParts.query) ? '?' + urlParts.query : '';
    //    res.redirect('/experiments/boost_fractals' + urlQuery);
    //});

    // api
    app.post('/exp/init', function (req, res) {
        var expData = config.get('expData');
        var exp_name = config.get('expName');
        var dateString = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        // TODO - validate user input before DB update

        DynamoDB
            .table('Experiments')
            .where('Name').eq(exp_name)
            .update({
                Subjects: DynamoDB.add(1),
                LastRun: dateString
            }, function (   err, data){
                if (err){
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ msg: err });
                }

                DynamoDB
                    .table('Experiments')
                    .where('Name').eq(exp_name)
                    .get(function (err, data){
                        if (err){
                            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ msg: err });
                        }

                        if (!req.session.id) {
                            req.session.id = generateSessionId();
                        }

                        req.session.exp = exp_name;
                        req.session.dt = dateString;

                        req.session.subject = req.body;
                        req.session.subject.number = data.Subjects;
                        req.session.subject.id = data.ShortName + '_' + req.session.subject.number;
                        req.session.stage = 1;

                        var sessionDir = exp_name + '/output/' + req.session.dt + '_' + req.session.id;
                        req.session.dir = sessionDir;

                        return res.send(expData);
                    });
            });
    });

    app.post('/exp/finish', function (req, res) {
        if (!req.session.subject) {
            return res.sendStatus(httpStatus.FORBIDDEN);
        }

        var dateString = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(' ', '_');
        var fileContent = req.body.Q0 || JSON.stringify(req.body) || '';

        s3.upload({
            Bucket: config.get('aws:s3Bucket'),
            Key: req.session.dir + '/' + req.session.subject.id + '_' + dateString + '_' + 'summary.txt',
            Body: fileContent
        }, function(err, data){
            if (req.session.subject != undefined && req.session.subject.midgam_id != undefined){
                var midgam_id = req.session.subject.midgam_id;
                req.session = null;

                console.log('Redirecting user with id ' + midgam_id + ' to https://www.midgampanel.com/surveyThanks2.asp');
                res.location('https://www.midgampanel.com/surveyThanks2.asp?USER=' + midgam_id + '&status=OK');

                // console.log('Redirecting user with id ' + midgam_id + ' to https://telaviv.qualtrics.com/SE/?SID=SV_0cWXPressnLSkjH');
                // res.location('https://telaviv.qualtrics.com/SE/?SID=SV_0cWXPressnLSkjH&uid=' + midgam_id);

                return res.sendStatus(httpStatus.CREATED);
            }

            if (err){
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }

            return res.sendStatus(httpStatus.OK);
        });
    });

    app.post('/exp/rankings', function (req, res) {
        if (!req.session.subject) {
            return res.sendStatus(httpStatus.FORBIDDEN);
            //return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ session: JSON.stringify(req.session), cookies: JSON.stringify(req.cookies) });
        }

        async.parallel([
            function (callback){
                json2csv({
                    data: req.body.trials,
                    fields: [
                        { value: 'subjectId', default: req.session.subject.id },
                        { value: 'midgamId', default: req.session.subject.midgam_id },
                        'runtrial', 'onsettime', 'ImageLeft', 'ImageRight', 'StimNumLeft', 'StimNumRight', 'Response', 'RT'],
                    quotes: ''
                },
                function(err, csv) {
                    if (err) {
                        return callback(err, null);
                    }

                    var dateString = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(' ', '_');

                    s3.upload({
                        Bucket: config.get('aws:s3Bucket'),
                        Key: req.session.dir + '/' + req.session.subject.id + '_'+ dateString + '_' + 'binary_ranking.csv',
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
                    fields: [
                        { value: 'subjectId', default: req.session.subject.id },
                        { value: 'midgamId', default: req.session.subject.midgam_id },
                        'StimName', 'StimNum', 'Rank', 'Wins', 'Losses',
                        { label: 'Total', value: function(row){ return row.Wins + row.Losses; }, default: '' }
                    ],
                    quotes: ''
                },
                function(err, csv) {
                    if (err) {
                        return callback(err, null);
                    }

                    var dateString = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(' ', '_');
                    s3.upload({
                        Bucket: config.get('aws:s3Bucket'),
                        Key: req.session.dir + '/' + req.session.subject.id + '_' + dateString + '_' + 'ItemsRankingResult.csv',
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
            if (err){
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }else{
                // TODO - destroy session here?
                return res.sendStatus(httpStatus.OK);
            }
        });
    });

    app.post('/exp/slider_ranking', function (req, res) {
        if (!req.session.subject) {
            return res.sendStatus(httpStatus.FORBIDDEN);
            //return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ session: JSON.stringify(req.session), cookies: JSON.stringify(req.cookies) });
        }

        json2csv({
            data: req.body.trials,
            fields: [
                { value: 'subjectId', default: req.session.subject.id },
                { value: 'midgamId', default: req.session.subject.midgam_id },
                'TrialNum', 'StimName', 'StimNum', 'Score', 'RT',
                { value: 'RankingRange', default: req.body.ranking_range }
            ],
            quotes: ''
        },
        function(err, csv) {
            if (err) {
                return callback(err, null);
            }

            var dateString = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(' ', '_');
            s3.upload({
                Bucket: config.get('aws:s3Bucket'),
                Key: req.session.dir + '/' + req.session.subject.id + '_' + dateString + '_' + 'SliderRankingResult.csv',
                Body: csv
            }, function(err, data){
                if (err){
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
                }else{
                    return res.sendStatus(httpStatus.OK);
                }
            });
        });
    });
};
