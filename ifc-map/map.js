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

var regionText = "This is the capital region where we worked..."
// var watershedText = "click to show the Amite watershed."



// var startText = ""
// setText(startText)



var initialBounds = [-91.49, 30, -90.15, 31.03]

// -90.25394273105334, lat: 31.271595758102706 }
//  // ​
//  // _sw: Object { lng: 803209260933, lat: 30.11583561514432

mapboxgl.accessToken = 'pk.eyJ1IjoiYWNveDQyIiwiYSI6ImNrZjVtd3ZiejBvYnkyeW9nZnB4MzVva3EifQ.COv27lSO4vobAVLLHNVkQg';
var map = new mapboxgl.Map({
  container: 'map',
  // style: 'mapbox://styles/legiongis/ckg13im88155l19pdgv294lu0',
  // style: 'mapbox://styles/mapbox/satellite-streets-v11',
  // style: 'mapbox://styles/acox42/ckg9uw0dq6xp019petpmu77yf',
  style: 'mapbox://styles/acox42/ckg9x9i0b2smo18mkero6jvm3',
  bounds: initialBounds,

  // interactive: false,
});
var nav = new mapboxgl.NavigationControl({'showCompass': false})
map.addControl(nav, 'top-left');

var buttonHover = function (hoverId) {
  var id;
  if (typeof this.id === 'undefined') {
    id = hoverId;
  } else {
    id = this.id;
  }

  if (showRegion == 'full-extent') {
    studyAreasFeatures.forEach(function(feature) {
      if (feature.properties.id == id) {
        setText(feature.properties.desc);
      } else if (id == "full-extent") {
        setText(regionText);
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

  var id;
  if (typeof this.id === 'undefined') {
    id = zoomTo;
  } else {
    id = this.id;
  }

  $("#"+id).addClass("active")
  showRegion = id;

  switch (id) {
    case "full-extent":
      // wsdFadeDir = "out";
      mskFadeDir = "out";
      comFadeDir = "in";

      padding = 0;

      setText(regionText);

      bounds = [-91.41, 29.99, -90.44, 30.74];
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
    feat.id = feat.properties.id
    studyAreasFeatures.push(feat)
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
      "line-color": "#ff0000",
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
  // THESE ARE ALL DEPRECATED IN FAVOR OF THE LAYERS DIRECTLY
  // IN THE BASEMAP STYLE
//   map.addSource('huc6', {
//     type: 'vector',
//     url: 'mapbox://acox42.dhw9cd9r'
//   });
//
//   var huc6Lyr = {
//     'id': 'huc6-lyr',
//     'type': 'line',
//     'source': 'huc6',
//     'source-layer': 'HU6LakeMaurepaBasin-05yq8z',
//     'paint': {
//       'line-color': '#000000',
//       'line-width': 3,
//       'line-opacity': 0,
//     },
//     'layout': {
//      'line-cap': 'round',
//      'line-join': 'round',
//     }
//   }
//
//   map.addSource('huc8', {
//     type: 'vector',
//     url: 'mapbox://acox42.8221d82f'
//   });
//  //  lng: -90.25394273105334, lat: 31.271595758102706 }
//  // ​
//  // _sw: Object { lng: -91.59803209260933, lat: 30.11583561514432
//
// // cap region
// //  Object { lng: -90.34581483541355, lat: 31.084832047956866 }
// // ​
// // _sw: Object { lng: -91.53259758184667, lat: 30.063066682664797 }
//
//   var huc8Lyr = {
//     'id': 'huc8-lyr',
//     'type': 'line',
//     'source': 'huc8',
//     'source-layer': 'HU8Boundaries-7m6k8g',
//     'paint': {
//       'line-color': '#ffffff',
//       "line-width": 2,
//       'line-opacity': 0,
//     },
//     'layout': {
//      'line-cap': 'round',
//      'line-join': 'round',
//     }
//   };
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
//   map.addSource('amite-watershed', {
//     type: "geojson",
//     data: "AmiteWatershed.geojson",
//   })
//
//   var amiteLyrWhite = {
//     'id': 'amite-lyr-white',
//     'type': 'line',
//     'source': 'amite-watershed',
//     'paint': {
//       "line-color": "#ffffff",
//       "line-width": 2,
//       "line-opacity": 0,
//     },
//     'layout': {
//      'line-cap': 'round',
//      'line-join': 'round',
//     }
//   };
//   var amiteLyr = {
//     'id': 'amite-lyr',
//     'type': 'line',
//     'source': 'amite-watershed',
//     'paint': {
//       "line-color": "#ff0000",
//       "line-dasharray": [2, 2],
//       "line-width": 2,
//       "line-opacity": 0,
//     },
//     'layout': {
//      'line-cap': 'round',
//      'line-join': 'round',
//     }
//   };
//
//
//   map.addSource('huc10', {
//     type: 'vector',
//     url: 'mapbox://acox42.983n0sb2'
//   });
//
//   var huc10Lyr = {
//     'id': 'huc10-lyr',
//     'type': 'line',
//     'source': 'huc10',
//     'source-layer': 'HU10Boundaries-7xz0h7',
//     'paint': {
//       'line-color': '#ffffff',
//       'line-width': .5,
//       'line-opacity': 0,
//     },
//     'layout': {
//      'line-cap': 'round',
//      'line-join': 'round',
//     }
//   };
//
//
//   map.addLayer(huc8LyrFill);
//   map.addLayer(huc8Lyr);
//   map.addLayer(huc10Lyr);
//   map.addLayer(huc6Lyr);
//   map.addLayer(amiteLyrWhite);
//   map.addLayer(amiteLyr);

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


});
