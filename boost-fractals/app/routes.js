var fs = require('fs');
var httpStatus = require('http-status');
var path = require('path');

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
        req.session.subject = req.body; // TODO - validate user input

        fs.readdir('./public/resources/' + exp_name + '/stimuli/images/', function(err, files){
            if (err){
                return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR).json({ err: err });
            }
            return res.send({
                stimuli: files,
                rankingTrials: 5,
                trainingRuns: 1,
                LV_GO_idxs: [],
                LV_NOGO_idxs: [],
                HV_GO_idxs: [],
                HV_NOGO_idxs: [],
                THROW_idxs: []
            });
        });
    });
};