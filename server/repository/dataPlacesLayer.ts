var mongoose = require('mongoose');
var Schema = mongoose.Schema;

import { Schema } from "inspector";

// Load configuration file for database
import { Config } from '../config'
import { Places } from "../model/places";

import { DataRadioLayer } from './dataRadioLayer'
import { Geo } from "./../model/geo";

let config = Config.database;

export class DataPlacesLayer {
    // Declare schema Task
    PlacesSchema = Schema({
        id: String,
        countryIndex: Number,
        name: String,
        lat: Number,
        lon: Number,
        channelCount: Number,
        // Primary key => id, countryIndex
    });

    PlacesModel: any;
    dataRadioLayer = new DataRadioLayer();

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
        this.PlacesModel = mongoose.model('places', this.PlacesSchema);
    }

    all(cb: Function) {
        this.PlacesModel.find(function (err: Error, places: any) {
            if(err) {
                throw err;
            }
            
            let placesArr = new Array<Places>();

            places.forEach((p: any) => {
                let place = new Places();
                place.setId(p.id);
                place.setCountryIndex(p.countryIndex);
                place.setName(p.name);
                place.setGeo(new Geo(p.lat, p.lon));
                place.setChannelCount(p.channelCount);
                placesArr.push(place);
            });

            cb(placesArr);
        });
    }

    public insertMultiple(places: Places[], cb: Function) {
        let newPlacesArr = new Array<any>();

        places.forEach(place => {
            let newPlaces = new this.PlacesModel({
                id: place.getId(),
                name: place.getName(),
                countryIndex: place.getCountryIndex(),
                lat: place.getGeo().lat,
                lon: place.getGeo().lon,
                channelCount: place.getChannelCount(),
            });

            newPlacesArr.push(newPlaces);
        });

        let dataRadioLayer = this.dataRadioLayer;
        this.PlacesModel.collection.insertMany(newPlacesArr, function(err: Error) {
            if(err) {
                throw err;
            }

            let channelArr = new Array<any>();
            places.forEach(place => {
                place.getChannels().forEach(channel => {
                    channelArr.push(channel);
                });
            });

            dataRadioLayer.insertMultiple(channelArr, (err: Error) => {
                if(err) {
                    throw err;
                }

                cb();
            });
        });
    }
};