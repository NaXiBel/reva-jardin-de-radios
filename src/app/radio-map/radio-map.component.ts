import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';

import { ChannelService } from './../channel.service'

import { Place } from './../place';
import { Radio } from './../radio';

@Component({
    selector: 'app-radio-map',
    templateUrl: './radio-map.component.html',
    styleUrls: ['./radio-map.component.sass']
})

export class RadioMapComponent implements OnInit {
    radio_name : String = "Sélectionnez une radio avant";
    radio_src : String = ""
    radio_place : String;

    radio_channels = new Array<Radio>();

    placesStorage = new Array<Place>();

    constructor(private channelService: ChannelService) { }

    @Output() mapLoaded = new EventEmitter<boolean>();
    @ViewChild('mapViewNode') private mapViewEl: ElementRef;

    @ViewChild("radio_player") audio;
    @ViewChild("info") infoBarObj;
    @ViewChild("control_panel") controlPanelObj;

    private _zoom: number = 10;
    private _center: Array<number> = [0.1278, 51.5074];
    private _basemap: string = 'satellite';

    @Input()
    set zoom(zoom: number) {
        this._zoom = zoom;
    }

    get zoom(): number {
        return this._zoom;
    }

    @Input()
    set center(center: Array<number>) {
        this._center = center;
    }

    get center(): Array<number> {
        return this._center;
    }

    @Input()
    set basemap(basemap: string) {
        this._basemap = basemap;
    }

    get basemap(): string {
        return this._basemap;
    }

    async initializeMap() {
        try {
            const [EsriMap, EsriMapView, EsriGraphic, EsriPoint, EsriSimpleMarkerSymbol] = await loadModules([
                'esri/Map',
                'esri/views/SceneView',
                "esri/Graphic",
                "esri/geometry/Point",
                "esri/symbols/SimpleMarkerSymbol",
                "esri/layers/FeatureLayer"
            ]);

            // Set type of map
            const mapProperties = {
                basemap: this._basemap
            };

            const map = new EsriMap(mapProperties);

            // Set type of map view
            const mapViewProperties = {
                container: this.mapViewEl.nativeElement,
                center: this._center,
                // zoom: this._zoom,
                scale: 50000000,
                map: map
            };

            const mapView = new EsriMapView(mapViewProperties);

            // All resources in the MapView and the map have loaded.
            // Now execute additional processes
            mapView.when(() => {
                this.mapLoaded.emit(true);
                this.channelService.getData().subscribe(data => {
                    data.places.forEach(p => {
                        let place = new Place(p);

                        // Create a symbol for drawing the point
                        var markerSymbol = new EsriSimpleMarkerSymbol({
                            color: [0, 255, 0],
                            size: (place.channelCount > 4 ? (place.channelCount > 20 ? 20 : place.channelCount) : 4) + "px"
                            // outline: {
                            //   color: [255, 255, 255],
                            //   width: 1
                            // }
                        });

                        var point = new EsriPoint({
                            longitude: place.geo.lon,
                            latitude: place.geo.lat
                        });

                        // Create a graphic and add the geometry and symbol to it
                        var pointGraphic = new EsriGraphic({
                            geometry: point,
                            symbol: markerSymbol,
                            data: {
                                place: place,
                            }
                        });
                        
                        // Add the graphic to the view
                        mapView.graphics.add(pointGraphic);
                    });

                    let instance = this;
                    mapView.on('click', function(event) {
                        mapView.hitTest(event).then(function(response) {
                            var hitpoint = response.results[0].graphic;

                            instance.channelService.getChannels(hitpoint.data.place.id).subscribe(radios => {
                                instance.radio_channels = [];
                                radios.channels.forEach((channel:any) => {
                                    let radio = new Radio(channel);
                                    radio.place_name = hitpoint.data.place.name;
                                    instance.radio_channels.push(radio);
                                });
                            });
                        });
                    });
                });
            });
        } 
        catch (error) {
            console.log('We have an error: ' + error);
        }
    }
    
    ngOnInit() {
        this.initializeMap();
    }

    public changeChannel(radio: Radio) {
        this.radio_name = radio.getName();
        this.radio_src = radio.getStream();
        this.radio_place = radio.place_name;
        this.channelService.startStream(radio.getStream()).subscribe(() => {
            console.log("Start playing audio");
            this.play();
        });
    }

    public play() {
        this.audio.nativeElement.pause();

        if(!this.controlPanelObj.nativeElement.classList.contains('active')) {
            this.controlPanelObj.nativeElement.classList.add('active');
            this.audio.nativeElement.load();
            this.audio.nativeElement.play();
        }
        else {
            this.controlPanelObj.nativeElement.classList.remove('active');
        }

        if(!this.infoBarObj.nativeElement.classList.contains('active')) {
            this.infoBarObj.nativeElement.classList.add('active');
        }
        else {
            this.infoBarObj.nativeElement.classList.remove('active');
        }
    }

    public next() {
        for(let i = 0; i < this.radio_channels.length; ++i) {
            let radio = this.radio_channels[i];
            if(radio.getName() == this.radio_name) {
                i = (i + 1)%this.radio_channels.length;
                radio = this.radio_channels[i];
                this.changeChannel(radio);
                this.play();
                break;
            }
        }
    }

    public previous() {
        for(let i = 0; i < this.radio_channels.length; ++i) {
            let radio = this.radio_channels[i];
            if(radio.getName() == this.radio_name) {
                i = (i - 1 + this.radio_channels.length)%this.radio_channels.length;
                radio = this.radio_channels[i];
                this.changeChannel(radio);
                this.play();
                break;
            }
        }
    }
}
