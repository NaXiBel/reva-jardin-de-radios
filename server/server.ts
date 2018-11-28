const express = require('express');

const path = require('path');

const fs = require('fs');

// Needed for search method
// used to parse the request in param to get the param
const bodyParser = require('body-parser');

import { DataRadioLayer } from './repository/dataRadioLayer'
import { Places } from './model/places';
import { Radio } from './model/radio';
import { DataPlacesLayer } from './repository/dataPlacesLayer';

export class Server {
    app = express();
    port : Number = 8080;

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

                dataJSON.places.forEach((placesJSON : any) => {
                    let places = new Places(placesJSON);
                    
                    for(let chan = indiceRadio; chan < (indiceRadio + places.getChannelCount()); ++chan) {
                        let stream = "http://listen.radio.garden/streams/"+ places.id[0] +"/" + places.id + "/" + dataJSON.channels[chan].id + ".php"
                        let radio = new Radio(dataJSON.channels[chan]);
                        radio.setStream(stream);
                        radio.setPlacesId(places.id);
                        places.addChannel(radio);
                    }
                    
                    indiceRadio += places.getChannelCount();

                    placesArr.push(places);
                });
                
                // Save all data
                this.dataPlacesLayer.insertMultiple(placesArr, () => {
                    res.send({
                        success: true
                    });        
                });
            }
        });
    }

    public start() {
        this.app.listen(this.port);
        console.log('[SERVER] Starting on port ' + this.port);
    }
}

let server = new Server();
server.start();