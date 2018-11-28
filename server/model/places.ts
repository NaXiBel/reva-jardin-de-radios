import { Geo } from './geo'
import { Radio } from './radio'

export class Places {
    id: String;
    countryIndex: number;
    name: String;
    geo: Geo;
    channelCount: number;
    channels: Radio[];
    
    constructor(json?: any) {
        if(json != undefined) {
            this.id = json.id;
            this.countryIndex = json.countryIndex;
            this.name = json.name;
            this.geo = new Geo(json.geo[0], json.geo[1]);
            this.channels = new Array<Radio>();
            this.channelCount = json.channelCount;
        }
        else {
            this.channels = new Array<Radio>();
        }
    }

    public getChannels() : Radio[] {
        return this.channels
    }

    public addChannel(radio: Radio) {
        this.channels.push(radio);
    }

    public setId(id: String) : void {
        this.id = id;
    }

    public getId() : String {
        return this.id;
    }

    public setName(name: String) : void {
        this.name = name;
    }
    
    public getName() : String {
        return this.name;
    }

    public getCountryIndex() : number {
        return this.countryIndex;
    }

    public setCountryIndex(index: number) : void {
        this.countryIndex = index;
    }

    public setGeo(geo: Geo) {
        this.geo = geo;
    }

    public getGeo() : Geo {
        return this.geo;
    }

    public getChannelCount() : number {
        return this.channelCount;
    }

    public setChannelCount(nb : number) : void {
        this.channelCount = nb;
    }
}