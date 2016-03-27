var config = require('./config')
var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');
var _ = require('lodash');
var json2csv = require('json2csv');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

module.exports = function (app) {
    // browser routes
    app.get('/fractals', function (req, res) {
        res.sendFile(path.normalize(__dirname + '/../public/views/boost_fractals2.html'));
    });

    // api
    app.get('/stim/vis/:name', function (req, res) {
        s3.getObject({
            Bucket: config.get('aws:s3Bucket'),
            Key: config.get('expData:name') + '/images/stimuli/' + req.params.name
        }, function(err, data) {
            if (err){
                return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }
            res.type(data.ContentType).send(data.Body);
        });
    });

    app.get('/resource', function (req, res) {
        s3.getObject({
            Bucket: config.get('aws:s3Bucket'),
            Key: req.query.path
        }, function(err, data) {
            if (err){
                return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }
            res.type(data.ContentType).send(data.Body);
        });
    });

    app.post('/exp/init', function (req, res) {
        var expData = config.get('expData');
        var exp_name = expData.name;

        // get expData from amazon s3
        //s3.getObject({
        //    Bucket: config.get('aws:s3Bucket'),
        //    Key: exp_name + '/expData.json'
        //}, function(err, data) {
        //    if (err){
        //        return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
        //    }
        //    res.type(data.ContentType).send(data.Body);
        //});

        req.session.exp = exp_name;
        req.session.dt = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        req.session.subject = req.body; // TODO - validate user input
        req.session.stage = 1;

        var sessionDir = exp_name + '/output/user_' + req.session.id + '_' + req.session.dt;
        req.session.dir = sessionDir;

        s3.listObjects({
            Bucket: config.get('aws:s3Bucket'),
            Prefix: config.get('expData:name') + "/images/"
        }, function(err, data){
            if (err){
                return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }

            expData.stimuli = _.map(_.filter(data.Contents, function(item){
                return item.Key.indexOf('stimuli') > -1 && _.endsWith(_.toLower(item.Key), '.jpg')
            }), function(item){
                    return path.basename(item.Key);
            });

            expData.instructions = _.map(_.filter(data.Contents, function(item){
                return item.Key.indexOf('instructions') > -1 && _.endsWith(_.toLower(item.Key), '.jpg')
            }), 'Key');

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

            s3.upload({
                Bucket: config.get('aws:s3Bucket'),
                Key: req.session.dir + '/ranking_result.csv',
                Body: csv
            }, function(err, data){
                if (err){
                    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
                }
                return res.sendStatus(httpStatus.OK);
            });
            //fs.writeFile(req.session.dir + '/rankings_result.csv', csv);
        });
    });
};