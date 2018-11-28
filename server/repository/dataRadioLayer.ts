// uuid-v4 = Génére un id unique
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

import { Schema } from "inspector";
import { Radio } from '../model/radio';

// Load configuration file for database
import { Config } from '../config'
let config = Config.database;

let RadioSchema = Schema({
    _id: String,
    name: String,
    ranking: Number,
    stream: String,
    place_id: String
});

export class DataRadioLayer {
    // Declare schema Task
    RadioModel: any;

    constructor() {
        let mongo_url = "mongodb://" + config.host + ":" + config.port + "/" + config.name;

        // Connect to mongoDB table
        mongoose.connect(mongo_url, function (err: Error) {
            if (err) {
                throw err;
            }
            else {
                console.log("MongoDB connected");
            }
        });

        // Init model
        this.RadioModel = mongoose.model('radio', RadioSchema);
    }

    all(cb: Function) {
        this.RadioModel.find(function (err: Error, radios: any) {
            if(err) {
                throw err;
            }
            
            let radiosArr = new Array<Radio>();

            radios.forEach(r => {
                let radio = new Radio();
                radio.setId(r.id);
                radio.setName(r.name);
                radio.setRanking(r.ranking);
                radio.setStream(r.stream);
                radio.setPlacesId(r.place_id);
                radiosArr.push(radio);
            });

            cb(radiosArr);
        });
    }

    get(p_id: number, cb: Function) {
        this.RadioModel.find({place_id: p_id}, function(err: Error, radios: any) {
            if(err) {
                throw err;
            }
            
            let radiosArr = new Array<Radio>();

            radios.forEach(r => {
                let radio = new Radio();
                radio.setId(r.id);
                radio.setName(r.name);
                radio.setRanking(r.ranking);
                radio.setStream(r.stream);
                radio.setPlacesId(r.place_id);
                radiosArr.push(radio);
            });

            cb(radiosArr);
        });
    }
    public insertMultiple(radios: Radio[], cb: Function) : void {
        let newRadioArr = new Array<any>();

        radios.forEach(radio => {
            let newRadio = new this.RadioModel({
                id: radio.getId(),
                name: radio.getName(),
                stream: radio.getStream(),
                ranking: radio.getRanking(),
                place_id: radio.getPlaceId()
            });

            newRadioArr.push(newRadio)
        });

        if(newRadioArr.length > 0) {
            this.RadioModel.collection.insertMany(newRadioArr, function(err: Error) {
                if(err) {
                    throw err;
                }
    
                cb();
            });
        }
        else {
            cb();
        }
    }
};