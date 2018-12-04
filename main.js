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

const NUMBER_OF_CHANNELS_PER_PAGE = 4;
var currentChannelList = {
    place : null,
    channels : [],
    current_page : 1
}

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
            container: "viewDiv",    
            map: map,                 
            scale: 50000000,          
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
            url : "http://data.radio.garden/live.json?v=3&b=55e8ce17b1c9c2d39af7-11-29&noOutdatedSC=1",
            method : "GET"
        })
        .done(function(res) {
            var places = res.places;
            var channels = res.channels;

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
                currentChannelList = {
                    place : hitPoint.data.place,
                    channels : hitPoint.data.channels,
                    current_page : 1
                };

                displayChannelPagination(currentChannelList, 1);


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

        $('#hud-bottom').on('click', '.nav-pages-next', function() {
            ++currentChannelList.current_page;
            displayChannelPagination(currentChannelList, currentChannelList.current_page);
            
        });

        $('#hud-bottom').on('click', '.nav-pages-prev', function() {
            --currentChannelList.current_page;
            displayChannelPagination(currentChannelList, currentChannelList.current_page);
            
        });

    
    });


});

/**
 * 
 * @param {*} channelList 
 * @param {*} pageNumber 
 */
function displayChannelPagination(channelList, pageNumber) {
    console.log(channelList);
    var content = '<div id="hud-place-title">'+channelList.place.name+'</div>'+'<div id="hud-channel">';


    for(var i = (pageNumber - 1) * NUMBER_OF_CHANNELS_PER_PAGE ; i < (pageNumber - 1) * NUMBER_OF_CHANNELS_PER_PAGE + NUMBER_OF_CHANNELS_PER_PAGE  && i < channelList.channels.length; ++i ) {
        console.log(i);
        content += '<button class="channel-button" id="'+channelList.place.id[0]+'/'+channelList.place.id+'/'+channelList.channels[i].id+'">'+channelList.channels[i].name+'</button><br />';
    }
    
    content += '<div id="nav-pagination">';
    if(pageNumber > 1) {
        content += '<a href="#" class="nav-pages-prev" id="'+(pageNumber-1)+'"> < </a>';
    }
    
    content += channelList.current_page;

    var totalOfPages = (channelList.channels.length / NUMBER_OF_CHANNELS_PER_PAGE) + 1;

    if(pageNumber < totalOfPages - 1) {
        content += ('<a href="#" class="nav-pages-next" id="'+(pageNumber + 1)+'"> > </a>') ;
    }

    content += '</div></div>'
    
    console.log(content);
    $('#hud-bottom').html(content);
}