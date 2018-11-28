import { Geo } from './geo'
import { Radio } from './radio'

export class Place {
    id: String;
    countryIndex: number;
    name: String;
    geo: Geo;
    channelCount: number;
    channels: Radio[];

    constructor(data?: any) {
        if(data != undefined) {
            this.channelCount = data.channelCount;
            this.countryIndex = data.countryIndex;
            this.id = data.id;
            this.name = data.name;
            this.geo = new Geo(data.geo.lat, data.geo.lon);
            // this.
        }
        else {
            this.channels = new Array<Radio>();
        }
    }

    public getCountryIndex() : number {
        return this.countryIndex;
    }

    public getName() : String {
        return this.name;
    }

    public getGeo() : Geo {
        return this.geo;
    }

    public getChannelCount() : number {
        return this.channelCount;
    }

    public getChannels() : Radio[] {
        return this.channels;
    }
}