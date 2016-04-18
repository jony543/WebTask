var config = require('./config')
var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var _ = require('lodash');
var json2csv = require('json2csv');

var AWS = require('aws-sdk');
AWS.config.update({region:'eu-west-1'});
var s3 = new AWS.S3();

var $db = new AWS.DynamoDB();
var DynamoDB = require('aws-dynamodb')($db);
DynamoDB.on('error', function( operation, error, payload ) {
    // you could use this to log fails into LogWatch for
    // later analysis or SQS queue lazy processing
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
    app.get('/fractals', function (req, res) {
        //TODO - move to serve static middleware
        res.sendFile(path.normalize(__dirname + '/../public/views/boost_fractals2.html'));
    });

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
            }, function (err, data){
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

    app.post('/exp/rankings', function (req, res) {
        if (!req.session.subject) {
            return res.sendStatus(httpStatus.FORBIDDEN);
            //return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ session: JSON.stringify(req.session), cookies: JSON.stringify(req.cookies) });
        }

        async.parallel([
            function (callback){
                json2csv({
                    data: req.body.trials,
                    fields: [ { value: 'subjectId', default: req.session.subject.id }, 'runtrial', 'onsettime', 'ImageLeft', 'ImageRight', 'StimNumLeft', 'StimNumRight', 'Response', 'RT'],
                    quotes: ''
                },
                function(err, csv) {
                    if (err) {
                        return callback(err, null);
                    }

                    s3.upload({
                        Bucket: config.get('aws:s3Bucket'),
                        Key: req.session.dir + '/' + req.session.subject.id + '_' + 'binary_ranking.csv',
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
                        'StimName', 'StimNum', 'Rank', 'Wins', 'Losses',
                        { label: 'Total', value: function(row){ row.Wins + row.Losses }, default: '' }
                    ],
                    quotes: ''
                },
                function(err, csv) {
                    if (err) {
                        return callback(err, null);
                    }

                    s3.upload({
                        Bucket: config.get('aws:s3Bucket'),
                        Key: req.session.dir + '/' + req.session.subject.id + '_' + 'ItemsRankingResult.csv',
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
