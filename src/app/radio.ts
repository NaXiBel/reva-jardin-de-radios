export class Radio {
    id: String;
    name: String;
    ranking: Number;
    stream: String;
    place_id: String;
    place_name: String;

    constructor(data?: any) {
        if(data != undefined) {
            this.id = data.id;
            this.name = data.name;
            this.ranking = data.ranking;
            this.stream = data.stream;
            this.place_id = data.place_id;
        }
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

    public setStream(stream: String) : void {
        this.stream = stream;
    }

    public getStream() : String {
        return this.stream;
    }

    public setRanking(ranking: Number) : void {
        this.ranking = ranking;
    }

    public getRanking() : Number {
        return this.ranking;
    }

    public setPlacesId(place_id: String) : void {
        this.place_id = place_id;
    }

    public getPlaceId() : String {
        return this.place_id;
    }
}