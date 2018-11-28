const MARKER = {
    TYPE : "simple-marker",
    SMALL_SIZE : "3px",
    MEDIUM_SIZE : "6px",
    LARGE_SIZE : "10px",
    SHAPE : "circle",
    COLOR : [0, 255, 0],
    OUTLINE : { 
        color: [ 0, 0, 0 ],
        width: 0  
    }
};


$( document ).ready(function() {

    require([
        "esri/Map",
        "esri/views/SceneView",
        "esri/layers/GraphicsLayer",
        "esri/Graphic",
        "esri/widgets/LayerList"
        ], function(Map, SceneView, GraphicsLayer, Graphic, LayerList){
        var map = new Map({
            basemap: "satellite",
            ground: "world-topobathymetry"
        });
        var view = new SceneView({
            container: "viewDiv",     // Reference to the scene div created in step 5
            map: map,                 // Reference to the map object created before the scene
            scale: 50000000,          // Sets the initial scale to 1:50,000,000
            center: [-101.17, 21.78],
            environment: {
                background: {
                    type: "color",
                    color: [55, 63, 94, 1]
                },
                starsEnabled: false,
                atmosphereEnabled: false,
                lighting : {
                    directShadowEnabled : false,
                    ambientOcclusionEnabled : false
                }
            }  // Sets the center point of view with lon/lat
        });

        var graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        var largeMarker = {
            type: MARKER.TYPE,  // autocasts as new SimpleMarkerSymbol()
            style: MARKER.SHAPE,
            color: MARKER.COLOR,
            size: MARKER.LARGE_SIZE, 
            outline : MARKER.OUTLINE
        };

        var mediumMarker = {
            type: MARKER.TYPE,  // autocasts as new SimpleMarkerSymbol()
            style: MARKER.SHAPE,
            color: MARKER.COLOR,
            size: MARKER.MEDIUM_SIZE,
            outline : MARKER.OUTLINE 
        }

        var smallMarker = {
            type: MARKER.TYPE,  // autocasts as new SimpleMarkerSymbol()
            style: MARKER.SHAPE,
            color: MARKER.COLOR,
            size: MARKER.SMALL_SIZE ,
            outline : MARKER.OUTLINE
        }

        var channelsByPlace = [];

        $.ajax({
            url : "http://rstglb.stephanenativel.fr/api/all",
            method : "GET"
        })
        .done(function(res) {
            var places = res.data[0].places;
            var channels = res.data[0].channels;

            var channelIndex = 0;

            for(var i = 0; i < places.length; ++i) {
                var point = {
                    type : "point",
                    latitude : places[i].geo[0],
                    longitude : places[i].geo[1]
                }

                var marker;
                if(places[i].channelCount === 1) {
                    marker = smallMarker;
                } else if(places[i].channelCount > 1 && places[i].channelCount < 5) {
                    marker = mediumMarker;
                } else if(places[i].channelCount >= 6) {
                    marker = largeMarker;
                } 

                var radios = [];
                for(var j = 0; j < places[i].channelCount; ++j) {
                    radios.push(channels[j + channelIndex]);
                }

                
                var pointGraphic = new Graphic({
                    geometry: point,
                    symbol : marker,
                    data : {
                        place : places[i],
                        channels : radios
                    } 
                });
                
                graphicsLayer.add(pointGraphic);
                channelsByPlace.push({
                    placeId : places[i].id,
                    channels : radios
                });
                channelIndex += j;
            }

            console.log(channelsByPlace);
        });

        view.on("click", function(event) {
            view.hitTest(event).then(function(response) {
                var hitPoint = response.results[0].graphic;
                console.log(hitPoint.data.place);
                var content = '<div id="hud-place-title">'+hitPoint.data.place.name+'</div>'+'<div id="hud-channel">';

                hitPoint.data.channels.forEach(channel => {
                    content += '<button class="channel-button" id="'+hitPoint.data.place.id[0]+'/'+hitPoint.data.place.id+'/'+channel.id+'">'+channel.name+'</button>';
                });
                
                content += '</div>';
                $('#hud-bottom').html(content);


            }); 
        });
        var audio = $('#audio')[0];
        $("#hud-bottom").on('click', '.channel-button', function() {

            audio.load();
            var link = $(this).attr('id');
            var url = "http://listen.radio.garden/streams/"+link+".php?1543278584734";
            $.ajax({
                method : "GET",
                url : url
            })
            .done(function(res) {
                console.log('station marche');

            })
            .fail(function(err) {
                console.log('Erreur de la station');
                console.log(err);
            })

            $('#audio').html('<source  src="'+url+'" type="audio/mpeg"></video>');
            setTimeout(function(){
                console.log(audio);
                var playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {

                    })
                    .catch(error => {
                        console.log(error);
                    });
                }
            }, 500);
            


        });

    
    });


});