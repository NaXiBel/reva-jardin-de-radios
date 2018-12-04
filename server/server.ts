const express = require('express');

const path = require('path');

const fs = require('fs');

// Needed for search method
// used to parse the request in param to get the param
const bodyParser = require('body-parser');

const http = require('http');

const vlc = require('fluent-vlc');
const { exec } = require('child_process');

import { DataRadioLayer } from './repository/dataRadioLayer'
import { Places } from './model/places';
import { Radio } from './model/radio';
import { DataPlacesLayer } from './repository/dataPlacesLayer';

export class Server {
    app = express();
    port : Number = 8100;

    dataPlacesLayer = new DataPlacesLayer();
    dataRadioLayer = new DataRadioLayer();

    constructor(public p?: Number) {
        if(p != undefined) {
            this.port = p;
        }

        // init parser with express
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        // authorize access to public directory to server html, css, js
        // this.app.use(express.static(path.join(__dirname, '../dist')));

        // Add headers
        this.app.use(function (req: any, res: any, next: any) {
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8100');
            res.setHeader('Access-Control-Allow-Origin', '*');

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

        this.api();
    }

    private api() {
        this.app.post('/getData', (req: any, res: any) => {
            this.dataPlacesLayer.all((places: Places[]) => {
                res.send({
                    success: true,
                    places: places
                });
            });
        });

        this.app.post('/:place_id/channels', (req: any, res: any) => {
            console.log("[SERVER] Request sended");
            this.dataRadioLayer.get(req.params.place_id, (radios) => {                
                res.send({
                    success: true,
                    channels: radios
                });
            });
        });

        this.app.post('/updateData', (req: any, res: any) => {
            if(!fs.existsSync(__dirname + "/live.json")) {
                res.send({
                    success: false,
                    message: "Database file not found"
                });
            }
            else {
                let data = fs.readFileSync(__dirname + "/live.json");
                let dataJSON = JSON.parse(data);

                // Delete all database data
                
                // Get all data
                let indiceRadio = 0;
                let placesArr = new Array<Places>();
                let instance = this;
                let removedRadio = 0;
                dataJSON.places.forEach((placesJSON : any) => {
                    let places = new Places(placesJSON);
                    
                    for(let chan = indiceRadio; chan < (indiceRadio + places.getChannelCount() + removedRadio); ++chan) {
                        this.getRealStream(places, dataJSON.channels[chan].id, function(stream) {
                            let radio = new Radio(dataJSON.channels[chan]);
                            if(stream !== "") {
                                radio.setStream(stream);
                                radio.setPlacesId(places.id);
                                places.addChannel(radio);
    
                                // TODO: If no channel => Remove radio => Decrease channel count => If channel count = 0 => Remove places                       
    
                                if(places.getChannelCount() > 0 && places.getChannelCount() == places.getChannels().length) {
                                    placesArr.push(places);
                                }
    
                                if(placesArr.length == dataJSON.places.length - removedRadio) {
                                    // Save all data
                                    instance.dataPlacesLayer.insertMultiple(placesArr, () => {
                                        res.send({
                                            success: true
                                        });        
                                    });
                                }
                            }
                            else {
                                places.setChannelCount(places.getChannelCount() - 1);
                                removedRadio++;
                            }
                        });
                    }
                    
                    indiceRadio += places.getChannelCount();
                });
            }
        });

        this.app.post('/stream', (req: any, res:any) => {
            exec('killall -9 vlc', (stdout , stderr) => {
                let command = 'vlc '+ req.body.stream_url + ' --sout \'#transcode{vcodec=none,acodec=mp3,ab=128,channels=2,samplerate=44100,scodec=none}:http{dst=:8080/radio.mp3}\' --sout-all --sout-keep';
            
                exec(command, (out, err) => {

                });

                setTimeout(() => {
                    res.send({
                        success: true
                    });
                }, 1000);
            });

            // const path = '/home/guillaume/Downloads/tweekacore-da-tweekaz-circle-of-life.mp3'
            // const stat = fs.statSync(path)
            // const fileSize = stat.size
            // const range = req.headers.range
          
            // if (range) {
            //   const parts = range.replace(/bytes=/, "").split("-")
            //   const start = parseInt(parts[0], 10)
            //   const end = parts[1] 
            //     ? parseInt(parts[1], 10)
            //     : fileSize-1
            //   const chunksize = (end-start)+1
            //   const file = fs.createReadStream(path, {start, end})
            //   const head = {
            //     'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            //     'Accept-Ranges': 'bytes',
            //     'Content-Length': chunksize,
            //     'Content-Type': 'audio/mpeg',
            //   }
          
            //   res.writeHead(206, head);
            //   file.pipe(res);
            // } else {
            //   const head = {
            //     'Content-Length': fileSize,
            //     'Content-Type': 'audio/mpeg',
            //   }
            //   res.writeHead(200, head)
            //   fs.createReadStream(path).pipe(res)
            // }

        });
    }

    public start() {
        this.app.listen(this.port);
        console.log('[SERVER] Starting on port ' + this.port);
    }

    private getRealStream(place: Places, channel_id: String, callback: Function) {
        let options = {
            host: "listen.radio.garden",
            port: 80,
            path: "/streams/"+ place.id[0] +"/" + place.id + "/" + channel_id + ".php",
            method: 'GET'
        };

        let req = http.request(options, function(res) {
            if(res.statusCode == 301) {
                return callback(res.headers.location);
            }
            else if(res.statusCode === 200) {
                return callback("");
            }
            else {
                console.log(res.statusCode + " " + options.host + options.path);
                return callback("");
            }
        });

        req.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });

        req.end();
    }
}

let server = new Server();
server.start();