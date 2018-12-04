
const express = require('express');
const { exec } = require('child_process');

const hostname = '127.0.0.1';
const port = 3000;

var bodyParser = require('body-parser');
var usedPorts = [];
var streamedChannels = [];
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));


app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

var router = express.Router();

router.route('/stream')
    // post localhost:{{port}}/stream
    .post(function(req, res) {
        var requestedChannel = req.query.channel_id;

        // Check if channel is already streamed
        var foundChannel = streamedChannels.find(function(c) {
            return (requestedChannel.id === c.id)
        });
        var channel;

        // If it is not the case, so we need to found a non-used port
        if(!foundChannel) {

            var streamPort = 8085;

            for(var i = 0; i < usedPorts.length; ++i) {
                if(streamPort === usedPorts[i]) {
                    ++streamPort;
                } else {
                    break;
                }
            }
    
            usedPorts.push(streamPort);

            channel = {
                id : requestedChannel,
                url : 'http://localhost:' + streamPort + '/' + requestedChannel + '.mp3'
            }

            streamedChannels.push(channel);

        } else { // otherwise, we use the corresponding channel
            channel = foundChannel;
        }

        // VLC Command executiob
        var vlcPath = '"E:\\Program Files\\VideoLAN\\VLC\\vlc.exe" ';
        var vlcOutParams = ' :sout=#transcode{vcodec=none,acodec=mp3,ab=128,channels=2,samplerate=44100,scodec=none}:http{dst=:'+streamPort+'/'+ channel.id +'.mp3} :sout-all :sout-keep';
        var command = vlcPath + req.body.stream_url + vlcOutParams;
        exec(command, function(err, out, code) {
            console.log(err);

        });
        console.log(usedPorts);
        console.log(streamedChannels);
        
        // Response to the client spent
        res.json({
            url : channel.url
        });
    });

app.use(router);
app.listen(port, hostname, function() {
    console.log("Serveur en fonctionnement");
});
     