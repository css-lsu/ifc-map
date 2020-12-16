var MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWNveDQyIiwiYSI6ImNrZjVtd3ZiejBvYnkyeW9nZnB4MzVva3EifQ.COv27lSO4vobAVLLHNVkQg'
// lindsey's style on her account
var BASE_STYLE = 'mapbox://styles/l-taylor9/ckigllktr5a7p19p95nj9nt7k'

// some map behavior constants
var INITIAL_BOUNDS = [-91.49, 30, -90.15, 31.03]
var WELCOME_TEXT = "<em>use the buttons below to explore the communities we have worked with...</em>"

var AMITE_TEXT = "Within the Amite River watershed, we ....."
var AMITE_BOUNDS = [-91.67, 29.89, -89.95, 31.21];

// mapbox tileset uris and label names
var HUC6_MB_SRC = 'mapbox://acox42.dhw9cd9r';
var HUC6_MB_LYR = 'HU6LakeMaurepaBasin-05yq8z';
var HUC8_MB_SRC = 'mapbox://acox42.8221d82f';
var HUC8_MB_LYR = 'hu8boundaries-7m6k8g';
var HUC10_MB_SRC = 'mapbox://acox42.983n0sb2';
var HUC10_MB_LYR = 'HU10Boundaries-7xz0h7';
var PARISH_CENTROIDS_MB_SRC = 'mapbox://acox42.3ak5cakw';
var PARISH_CENTROIDS_MB_LYR = "AllParishes_centroids-cd7pvh";

var IFC_ORANGE = '#e35f3c';
var IFC_CSS = ['rgb', 207, 177, 76];
var IFC_CSS_FILL = ['rgba', 207, 177, 76, .2];
var IFC_STUDIO = ['rgb', 101, 198, 210];
var IFC_STUDIO_FILL = ['rgba', 101, 198, 210, .2];
var IFC_PARTNER = ['rgb', 145, 139, 195];
var IFC_PARTNER_FILL = ['rgba', 145, 139, 195, .2];

}




const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
function fadeLayers(direction, layers, maxOpacityPercent) {
  if (maxOpacityPercent === undefined) {maxOpacityPercent = 100}
  for(var i = 0; i < maxOpacityPercent + 1; i++){
    var n;
    if (direction == "in") { n = i } else { n = maxOpacityPercent - i}
    sleep(500).then(() => {
      layers.forEach( function(layer) {
        map.setPaintProperty(layer, map.getLayer(layer).type+'-opacity', n / 100);
      })
    })
  };
}


function freezeBounds() {
  map.setMaxBounds(map.getBounds());
  map.setMinZoom(map.getZoom());
}

function setText(text) {
  $("#description-box").html(`<p>${text}</p>`);
}



function setCommunitiesToYellow() {
  map.setPaintProperty('communities-fill', 'fill-color', IFC_CSS_FILL);
  map.setPaintProperty('communities-line', 'line-color', IFC_CSS);
}
function setCommunitiesToOrange() {
  map.setPaintProperty('communities-fill', 'fill-color', ['rgba', 0, 0, 0, 0]);
  map.setPaintProperty('communities-line', 'line-color', IFC_ORANGE);
}


// This is how a single parameter can be passed from the iframe
// to this script, and would allow this logic to conditionally construct
// different maps for different iframes.
// <iframe name="full" src="..."></iframe>
var showRegion;
var initializedAs;
if (window.name == "") {
  setText(WELCOME_TEXT);
  showRegion = "initial-extent";
  initializedAs = "mainPage";

} else {
  showRegion = window.name;
  initializedAs = "communityPage";
  // $(".top-bar").hide();
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

var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

var buttonHover = function (hoverId) {

  // this allows a hover id to be passed from either a clicked button or
  // clicked feature. (at least I think it does.... -AC 12-09-20)
  var id;
  if (typeof this.id === 'undefined') { id = hoverId; } else { id = this.id; }

  if (showRegion == 'initial-extent' || showRegion == 'amite-extent') {
    communitiesFeatures.forEach(function(feature) {
      if (feature.properties.id == id) {
        setText(feature.properties.desc);
      } else if (id == "initial-extent") {
        setText(WELCOME_TEXT);
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

  // this allows a zoom id to be passed from either a clicked button or
  // clicked feature.
  var id;
  if (typeof this.id === 'undefined') { id = zoomTo; } else { id = this.id; }

  $(".loc-button").removeClass("active")
  $("#"+id).addClass("active")
  showRegion = id;

  switch (showRegion) {
    case "amite-extent":

      setText(AMITE_TEXT);

      // begin zooming once the parameters have been acquired
      map.fitBounds(AMITE_BOUNDS, { padding: 0 });

      setCommunitiesToYellow();
      // map.setPaintProperty(HUC8_MB_LYR, "line-color", ['match', ['get', 'name'],
      //   "Amite", "red",
      //   "black"
      // ]);
      fadeLayers('in', ['amite-highlight', 'amite-mask'])
      fadeLayers('out', ['study-areas-line', 'study-areas-fill', 'communities-mask'])
      fadeLayers('in', ['communities-line', 'communities-fill'])
      break

    default:

      // clean up potential interaction artifacts
      popup.remove();
      map.getCanvas().style.cursor = '';

      communitiesFeatures.forEach(function(feature) {
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

      // begin zooming once the parameters have been acquired
      // currently unneeded extra padding control syntax
      // padding = {top: 50, bottom: 50, left: 50, right: 50}
      map.fitBounds(bounds, { padding: 50 });

      setCommunitiesToOrange();
      fadeLayers('in', [
        'study-areas-line',
        'study-areas-fill',
        'communities-mask',
        'communities-line',
        'communities-fill'
      ]);
      fadeLayers('out', ['amite-highlight', 'amite-mask'])
      break
  }

  // freeze the map once the zoom is completed.
  map.once('moveend', freezeBounds);
}

// acquire the geojson features for
var communitiesFeatures = [];
var communitiesJsonFile = "Communities.geojson"
$.getJSON(communitiesJsonFile, function(data) {
  data['features'].forEach(function(feat) {
    feat.id = feat.properties.id;
    communitiesFeatures.push(feat);
    // $("#communities-bar").append(
    //   $(`<button id="${feat.properties.id}" title="Show ${feat.properties.name}" class="loc-button">${feat.properties.name}</button>`)
    // )
  })
});

map.on('load', function() {

  $(".loc-button").removeAttr('disabled');
  $(".loc-button").click(buttonZoom);
  $(".loc-button").hover(buttonHover, buttonLeave);
  // this removes the incident layers which we don't need and cause an error.
  // eventually they should be removed directly from the Style.
  map.removeLayer('incident-closure-line-highlights-navigation')
  map.removeLayer('incident-closure-lines-navigation')
  map.removeLayer('incident-endpoints-navigation')
  map.removeLayer('incident-startpoints-navigation')
  map.removeSource('mapbox://mapbox.mapbox-incidents-v1')

  map.addSource('study-areas-source', {
    type: "geojson",
    data: "StudyAreas.geojson",
  })

  map.addLayer({
    'id': 'study-areas-line',
    "type": "line",
    "source": "study-areas-source",
    "paint": {
      "line-color": ['match', ['get', 'proj_type'],
        'css', IFC_CSS,
        'studio', IFC_STUDIO,
        'partner', IFC_PARTNER,
        IFC_CSS, //default
      ],
      "line-width": 3,
      "line-dasharray": [1, 1],
      "line-opacity": 0,
    }
  })

  map.addLayer({
    'id': 'study-areas-fill',
    "type": "fill",
    "source": "study-areas-source",
    "paint": {
      "fill-color": ['match', ['get', 'proj_type'],
        'css', IFC_CSS_FILL,
        'studio', IFC_STUDIO_FILL,
        'partner', IFC_PARTNER_FILL,
        IFC_CSS_FILL, //default
      ],
      "fill-opacity": 0,
    }
  })

  map.addSource('communities-source', {
    type: "geojson",
    data: communitiesJsonFile,
  })

  map.addSource('communities-mask-source', {
    type: "geojson",
    data: "CommunitiesMask.geojson",
  })

  map.addLayer({
    'id': 'communities-mask',
    "type": "fill",
    "source": "communities-mask-source",
    "paint": {
      "fill-color": ['rgba', 0, 0, 0, .5],
      "fill-opacity": 0,
    }
  });

  map.addLayer({
    'id': 'communities-fill',
    "type": "fill",
    "source": "communities-source",
    "paint": {
      "fill-color": IFC_CSS,
      "fill-opacity": 0,
    }
  })

  map.addLayer({
    'id': 'communities-line',
    "type": "line",
    "source": "communities-source",
    "paint": {
      "line-color": "#e35f3c",
      "line-width": 3,
      "line-opacity": 0,
    },
    'layout': {
     'line-cap': 'round',
     'line-join': 'round',
    }
  })

  map.addSource('amite-mask-source', {
    type: "geojson",
    data: "AmiteWatershedMask.geojson",
  })

  map.addLayer({
    'id': 'amite-mask',
    "type": "fill",
    "source": "amite-mask-source",
    "paint": {
      "fill-color": ['rgba', 0, 0, 0, .5],
      "fill-opacity": 0,
    }
  });

  map.addLayer({
    'id': 'amite-highlight',
    'type': 'line',
    'source': 'composite',
    'source-layer': 'HU8Boundaries-7m6k8g',
    "paint": {
      "line-color": ['match', ['get', 'Name'],
        "Amite", IFC_ORANGE,
        ['rgba', 0, 0, 0, 0]
      ],
      "line-width": 3,
      "line-opacity": 0,
    },
  })

  map.on('mouseenter', 'communities-fill', function (e) {
    // console.log(e.features[0].properties.id)
    // if (currentId !== e.features[0].properties.id) {
    //   currentId = e.features[0].properties.id;
    //   console.log(currentId);
    if (showRegion == "amite-extent") {
      buttonHover(e.features[0].properties.id)
      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = 'pointer';

      var lng = e.features[0].properties.lbl_x;
      var lat = e.features[0].properties.lbl_y;
      var description = e.features[0].properties.name;

      // Populate the popup and set its coordinates
      // var firstCoord = e.features[0].geometry.coordinates[0][0];
      popup.setLngLat([lng, lat])
        .setHTML(
          `<p><strong>${e.features[0].properties.name}</p>`
        )
        .addTo(map);
    }
    // }

  });

  map.on('mouseleave', 'communities-fill', function (e) {
    // console.log(e.features[0].properties.id)
    if (showRegion == "amite-extent") {
      setText(AMITE_TEXT);
      map.getCanvas().style.cursor = '';
      popup.remove()
    }

  });

  map.on('click', 'communities-fill', function (e) {
    buttonZoom(e.features[0].properties.id)
  });

  map.on('mouseenter', 'study-areas-fill', function (e) {

    // only add interaction if the map is zoomed to a specific community
    if (showRegion != "initial-extent" && showRegion != "amite-extent") {
      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = 'pointer';

      var lng = e.features[0].properties.lbl_x;
      var lat = e.features[0].properties.lbl_y;
      var description = e.features[0].properties.name;

      // Populate the popup and set its coordinates
      var firstCoord = e.features[0].geometry.coordinates[0][0];
      popup.setLngLat(firstCoord)
        .setHTML(
          `<p><strong>${e.features[0].properties.name}</strong><br>
          ${e.features[0].properties.year}</p>`
        )
        .addTo(map);
    }

  });

  map.on('mouseleave', 'study-areas-fill', function () {
    if (showRegion != "initial-extent" && showRegion != "amite-extent") {
      map.getCanvas().style.cursor = '';
      popup.remove();
    }
  });

});
