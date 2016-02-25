var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');

module.exports = function (app) {
    // application -------------------------------------------------------------
    app.get('/exp', function (req, res) {
        res.sendfile('./public/views/boost_fractals.html');
    });

    app.get('/stim/vis/:name', function (req, res) {
        res.sendFile(path.normalize(__dirname + '/../public/resources/' + 'boost_fractals' + '/stimuli/images/' + req.params.name));
    });

    app.get('/stimuli/vis', function (req, res) {
        fs.readdir('./public/resources/' + 'boost_fractals' + '/stimuli/images/', function(err, files){
            if (err){
                return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }
            return res.send({
                stimuli: files,
                rankingTrials: 5 // files.length * 2 + 3
            });
        });
    });
};