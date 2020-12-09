var MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWNveDQyIiwiYSI6ImNrZjVtd3ZiejBvYnkyeW9nZnB4MzVva3EifQ.COv27lSO4vobAVLLHNVkQg'
var BASE_STYLE = 'mapbox://styles/acox42/ckg9uw0dq6xp019petpmu77yf'
var BASE_STYLE = 'mapbox://styles/legiongis/ckg13im88155l19pdgv294lu0'
// var BASE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v11'
// var BASE_STYLE = 'mapbox://styles/acox42/ckg9x9i0b2smo18mkero6jvm3'
var BASE_STYLE = 'mapbox://styles/acox42/ckgtxvv580c9w19kx5gwzc47c'
// lindsey's style on her account
var BASE_STYLE = 'mapbox://styles/l-taylor9/ckigllktr5a7p19p95nj9nt7k'

// some map behavior constants
var INITIAL_BOUNDS = [-91.49, 30, -90.15, 31.03]
var CAP_REGION_BOUNDS = [-91.41, 29.99, -90.44, 30.74];
var CAP_REGION_TEXT = "This is the capital region where we worked..."

// mapbox tileset uris and label names
var HUC6_MB_SRC = 'mapbox://acox42.dhw9cd9r';
var HUC6_MB_LYR = 'HU6LakeMaurepaBasin-05yq8z';
var HUC8_MB_SRC = 'mapbox://acox42.8221d82f';
var HUC8_MB_LYR = 'HU8Boundaries-7m6k8g';
var HUC10_MB_SRC = 'mapbox://acox42.983n0sb2';
var HUC10_MB_LYR = 'HU10Boundaries-7xz0h7';
var PARISH_CENTROIDS_MB_SRC = 'mapbox://acox42.3ak5cakw';
var PARISH_CENTROIDS_MB_LYR = "AllParishes_centroids-cd7pvh";


const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function freezeBounds() {
  map.setMaxBounds(map.getBounds());
  map.setMinZoom(map.getZoom());
}

function setText(text) {
  $("#desc-box").html(text);
}

function fadeLayers(direction, layers, symbol, maxOpacityPercent) {
  // symbol must be 'line' for line layers or 'fill' for poly layers
  for(var i = 0; i < maxOpacityPercent + 1; i++){
    var n;
    if (direction == "in") { n = i } else { n = maxOpacityPercent - i}
    sleep(500).then(() => {
      layers.forEach( function(layer) {
        map.setPaintProperty(layer, symbol+'-opacity', n / 100);
      })
    })
  };
}

// This is how a single parameter can be passed from the iframe
// to this script, and would allow this logic to conditionally construct
// different maps for different iframes. Not currently in use.
// <iframe name="full" src"..."></iframe>
var showRegion;
if (window.name == "") {
  showRegion = "full-extent";

} else {
  showRegion = window.name;
  $(".top-bar").hide();
  $(".bottom-bar").hide();
  // $("#map").css("border-radius", "5px")
  // $(".mapboxgl-ctrl-attrib").css("border-radius", "5px")
}

var currentId;

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
var map = new mapboxgl.Map({
  container: 'map',
  style: BASE_STYLE,
  bounds: INITIAL_BOUNDS,
});
var nav = new mapboxgl.NavigationControl({'showCompass': false})
map.addControl(nav, 'top-left');

var buttonHover = function (hoverId) {

  // this allows a hover id to be passed from either a clicked button or
  // clicked feature. (at least I think it does.... -AC 12-09-20)
  var id;
  if (typeof this.id === 'undefined') { id = hoverId; } else { id = this.id; }

  if (showRegion == 'full-extent') {
    studyAreasFeatures.forEach(function(feature) {
      if (feature.properties.id == id) {
        setText(feature.properties.desc);
      } else if (id == "full-extent") {
        setText(CAP_REGION_TEXT);
      }
      // else if (id == "watershed-extent") {
      //   setText(watershedText);
      // }
    });
  }

}

// var buttonHoverLeave = function () {
//   setText("");
// }

var buttonZoom = function (zoomTo) {
  map.setMaxBounds(null);
  map.setMinZoom(0);

  $(".loc-button").removeClass("active")

  var bounds, maskFadeDir, padding;

  // this allows a zoom id to be passed from either a clicked button or
  // clicked feature.
  var id;
  if (typeof this.id === 'undefined') { id = zoomTo; } else { id = this.id; }

  $("#"+id).addClass("active")
  showRegion = id;

  switch (id) {
    case "full-extent":
      // wsdFadeDir = "out";
      mskFadeDir = "out";
      comFadeDir = "in";

      padding = 0;

      setText(CAP_REGION_TEXT);

      bounds = CAP_REGION_BOUNDS;
      break

    // case "watershed-extent":
      // wsdFadeDir = "in";
      // mskFadeDir = "out";myVar
      // comFadeDir = "out";
      //
      // setText(watershedText);
      //
      // bounds = [
      //   amiteFeature.properties.x1,
      //   amiteFeature.properties.y1,
      //   amiteFeature.properties.x2,
      //   amiteFeature.properties.y2,
      // ];
      // break

    default:
      // wsdFadeDir = "out";
      mskFadeDir = "in";
      comFadeDir = "in";

      padding = {top: 50, bottom: 50, left: 50, right: 50}

      studyAreasFeatures.forEach(function(feature) {
        if (feature.properties.id == id) {
          setText(feature.properties.desc);
          bounds = [
            feature.properties.x1,
            feature.properties.y1,
            feature.properties.x2,
            feature.properties.y2,
          ]
        }
      });
  }

  map.fitBounds(bounds, { padding: padding });

  map.once('moveend', freezeBounds);

  fadeLayers(mskFadeDir, ['mask'], 'fill', 50)
  fadeLayers(comFadeDir, ['communities-boundary', 'communities-boundary-white'], 'line', 100)
  // fadeLayers(wsdFadeDir,['huc6-lyr', 'huc8-lyr', 'huc10-lyr', 'amite-lyr', 'amite-lyr-white'],'line', 75)
  // fadeLayers(wsdFadeDir,['huc8-lyr-fill'],'fill', 75)
}

// acquire the geojson features for
var studyAreasFeatures = [];
var communitiesJson = "Communities.geojson"
$.getJSON(communitiesJson, function(data) {
  data['features'].forEach(function(feat) {
    feat.id = feat.properties.id;
    studyAreasFeatures.push(feat);
    $("#communities-bar").append(
      $(`<button id="${feat.properties.id}" title="Show ${feat.properties.name}" class="loc-button">${feat.properties.name}</button>`)
    )
  })
  $(".loc-button").click(buttonZoom);
  $(".loc-button").hover(buttonHover);
});

// acquire the geojson features for
// var amiteFeature;
// var amiteJson = "AmiteWatershed.geojson"
// $.getJSON(amiteJson, function(data) {
//   data['features'].forEach(function(feat) {
//     feat.id = feat.properties.id
//     amiteFeature = feat;
//   })
// });

map.on('load', function() {

  map.addSource('study-areas', {
    type: "geojson",
    data: communitiesJson,
  })

  map.addSource('study-areas-negative', {
    type: "geojson",
    data: "Communities_negative.geojson",
  })

  map.addLayer({
    'id': 'mask',
    "type": "fill",
    "source": "study-areas-negative",
    "paint": {
      "fill-color": "#000000",
      "fill-opacity": 0,
    }
  });

  map.addLayer({
    'id': 'communities',
    "type": "fill",
    "source": "study-areas",
    "paint": {
      "fill-color": "#00ffff",
      "fill-opacity": 0,
    }
  })

  map.addLayer({
    'id': 'communities-boundary-white',
    "type": "line",
    "source": "study-areas",
    "paint": {
      "line-color": "#ffffff",
      "line-width": 2,
      "line-opacity": 0,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  })

  map.addLayer({
    'id': 'communities-boundary',
    "type": "line",
    "source": "study-areas",
    "paint": {
      "line-color": "#e35f3c",
      // "line-dasharray": [2, 2],
      "line-width": 2,
      "line-opacity": 0,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  })

  map.on('mouseenter', 'communities', function (e) {
    // console.log(e.features[0].properties.id)
    if (currentId !== e.features[0].properties.id) {
      currentId = e.features[0].properties.id;
      console.log(currentId);
    }
    map.getCanvas().style.cursor = 'pointer';
    // buttonHover(e.features[0].properties.id)
    // buttonHover(e.features[0].properties.id)
    // popup.remove();
  });

  map.on('mousemove', 'communities', function (e) {
    // console.log(e)
    // if (currentId !== e.features[0].properties.id) {
    //   currentId = e.features[0].properties.id;
    //   console.log(currentId);
    // }

    // buttonHover(e.features[0].properties.id)
    // popup.remove();
  });

  map.on('mouseleave', 'communities', function () {
    map.getCanvas().style.cursor = '';
    // popup.remove();
  });

  map.on('click', 'communities', function (e) {

    buttonZoom(e.features[0].properties.id)
  });

  if (showRegion != "full-extent"){ buttonZoom(showRegion); }


  // these are all of the watershed sources
  // note urls are all defined at top of file
  map.addSource('huc6', { type: "vector", url: HUC6_MB_SRC });
  map.addSource('huc8', { type: 'vector', url: HUC8_MB_SRC });
  map.addSource('huc10', { type: 'vector', url: HUC10_MB_SRC });

  // definition of all watershed layers.
  // note source-layer is defined at top of file
  var huc8Lyr = {
    'id': 'huc8-lyr',
    'type': 'line',
    'source': 'huc8',
    'source-layer': HUC8_MB_LYR,
    'paint': {
      'line-color': [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        "hsla(293, 74%, 31%, 0.19)",
        18,
        "hsl(293, 74%, 31%)"
      ],
      "line-width": 1.5,
      "line-dasharray": [2, 2],
      'line-opacity': 1,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  };
//
//   var huc8LyrFill = {
//     'id': 'huc8-lyr-fill',
//     'type': 'fill',
//     'source': 'huc8',
//     'source-layer': 'HU8Boundaries-7m6k8g',
//     'paint': {
//       'fill-color': [
//         'case',
//         ["!=", ['get', 'Name'], "Amite"],
//         ['rgba', 0, 0, 0, .5],
//         ['rgba', 0, 0, 0, 0]
//       ],
//       'fill-opacity': 0,
//     }
//   };
//

//
  var amiteLyrWhite = {
    'id': 'amite-lyr-white',
    'type': 'line',
    'source': 'huc6',
    'source-layer': HUC6_MB_LYR,
    'paint': {
      "line-color": "#ffffff",
      "line-width": 3,
      "line-opacity": 1,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  };
  var amiteLyr = {
    'id': 'amite-lyr',
    'type': 'line',
    'source': 'huc6',
    'source-layer': HUC6_MB_LYR,
    'paint': {
      "line-color": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        "hsla(263, 80%, 24%, 0.8)",
        18,
        "hsla(263, 80%,000000 24%, 0.56)"
      ],
      "line-dasharray": [2, 2],
      "line-width": 3,
      "line-opacity": 1,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  };



  var huc10Lyr = {
    'id': 'huc10-lyr',
    'type': 'line',
    'source': 'huc10',
    'source-layer': HUC10_MB_LYR,
    'paint': {
      'line-color': [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        "hsla(290, 67%, 39%, 0)",
        18,
        "hsl(290, 67%, 39%)"
      ],
      'line-width': 1,
      "line-dasharray": [2, 2],
      'line-opacity': 1,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  };

  // map.addLayer(huc10Lyr);
  // map.addLayer(huc8Lyr);
  // map.addLayer(amiteLyrWhite);
  // map.addLayer(amiteLyr);

  // map.addLayer({
  //   'id': 'cities-hover',
  //   "type": "fill",
  //   "source": "study-areas",
  //   "paint": {
  //     'fill-color': '#627BC1',
      // 'fill-opacity': [
      //   'case',
      //   ['boolean', ['feature-state', 'hover'], false],
      //   .1,
      //   0
      // ]
  //   }
  // })

  // var popup = new mapboxgl.Popup({
  //   closeButton: false,
  //   closeOnClick: false
  // });


  // map.on('mouseenter', 'cities-hover', function (e) {
  //
  //   if (e.features.length > 0) {
  //     if (hoveredStateId) {
  //       map.setFeatureState(
  //           { source: 'study-areas', id: hoveredStateId },
  //           { hover: false }
  //         );
  //       }
  //       hoveredStateId = e.features[0].id;
  //       map.setFeatureState(
  //         { source: 'study-areas', id: hoveredStateId },
  //         { hover: true }
  //       );
  //     }
  //
  // });

  // map.on('mouseleave', 'cities-hover', function () {
  //   if (hoveredStateId) {
  //     map.setFeatureState(
  //       { source: 'study-areas', id: hoveredStateId },
  //       { hover: false }
  //     );
  //   }
  //   hoveredStateId = null;
  // });

  // map.on('mouseenter', 'cities-hover', function (e) {
    // Change the cursor style as a UI indicator.
    // map.getCanvas().style.cursor = 'pointer';
    //
    // var lng = e.features[0].properties.lbl_x;
    // var lat = e.features[0].properties.lbl_y;
    // var description = e.features[0].properties.name;

    // Populate the popup and set its coordinates
    // based on the feature found.
    // console.log(coordinates)
    // popup.setLngLat([lng, lat]).setHTML(description).addTo(map);

  // });

  // map.on('mouseleave', 'cities-hover', function () {
  //   map.getCanvas().style.cursor = '';
    // popup.remove();
  // });

  // var compositeSrc = {
  //     "composite": {
  //         "url": "mapbox://acox42.983n0sb2,mapbox.mapbox-streets-v8,acox42.dhw9cd9r,acox42.8221d82f,acox42.3ak5cakw,mapbox.mapbox-terrain-v2",
  //         "type": "vector"
  //     }
  // },

  // map.addSource('parishCentroids', {
  //     type: 'vector',
  //     url: PARISH_CENTROIDS_MB_SRC
  //   });
  //
  // var parishLabelsLyr = {
  //     "id": "allparishes-centroids-cd7pvh",
  //     "type": "symbol",
  //     "source": "parishCentroids",
  //     "source-layer": PARISH_CENTROIDS_MB_LYR,
  //     "layout": {
  //         "text-field": ["to-string", ["get", "NAMELSAD"]],
  //         "text-font": ["DIN Pro Italic", "Arial Unicode MS Regular"],
  //         "text-letter-spacing": 0.15,
  //         "text-size": 14,
  //         "text-allow-overlap": true
  //     },
  //     "paint": {}
  // }

  // map.addLayer(parishLabelsLyr);

});
