const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function freezeBounds() {
  map.setMaxBounds(map.getBounds());
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYWNveDQyIiwiYSI6ImNrZjVtd3ZiejBvYnkyeW9nZnB4MzVva3EifQ.COv27lSO4vobAVLLHNVkQg';
var map = new mapboxgl.Map({
  container: 'map',
  // style: 'mapbox://styles/legiongis/ckg13im88155l19pdgv294lu0',
  // style: 'mapbox://styles/mapbox/satellite-streets-v11',
  // style: 'mapbox://styles/acox42/ckg9uw0dq6xp019petpmu77yf',
  style: 'mapbox://styles/acox42/ckg9x9i0b2smo18mkero6jvm3',
  center: [-90.901, 30.401],
  zoom: 9.5,
  // interactive: false,
});

var hoveredStateId = null;

// map.on('zoomend', function() {
//   map.setMaxBounds(map.getBounds());
// })

map.on('load', function() {

  var jsonUrl = "https://raw.githubusercontent.com/css-lsu/web-mapping/main/ifc-map/StudyAreas.geojson"

  var jsonUrl = "StudyAreas.geojson"
  map.addSource('study-areas', {
    type: "geojson",
    data: jsonUrl,
  })

  map.addSource('study-areas-negative', {
    type: "geojson",
    data: "StudyAreasNegative.geojson",
  })

  // acquire the geojson features for
  var studyAreasFeatures = null;
  $.getJSON(jsonUrl, function(data) {
    studyAreasFeatures = data['features'];
  });

  map.addLayer({
    'id': 'mask',
    "type": "fill",
    "source": "study-areas-negative",
    "paint": {
      "fill-color": "#000000",
      "fill-opacity": 0,
    }
  });

  function fadeMask(direction) {
    for(var i = 0; i < 50; i++){
      var n;
      if (direction == "in") { n = i } else { n = 50 - i}
      sleep(500).then(() => {
        map.setPaintProperty(
          'mask',
          'fill-opacity',
          n / 100
        );
      })
    };
  }

  // map.addLayer({
  //   'id': 'cities',
  //   "type": "fill",
  //   "source": "study-areas",
  //   "paint": {
  //     "fill-color": "#00ffff",
  //     "fill-outline-color": "#00ff00",
  //   }
  // })

  map.addLayer({
    'id': 'cities',
    "type": "line",
    "source": "study-areas",
    "paint": {
      "line-color": "#ff0000",
      "line-dasharray": [2, 1],
      "line-width": 2,
    }
  })

  map.addLayer({
    'id': 'cities-hover',
    "type": "fill",
    "source": "study-areas",
    "paint": {
      'fill-color': '#627BC1',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        .1,
        0
      ]
    }
  })

  var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });


  map.on('mouseenter', 'cities-hover', function (e) {

    if (e.features.length > 0) {
      if (hoveredStateId) {
        map.setFeatureState(
            { source: 'study-areas', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = e.features[0].id;
        map.setFeatureState(
          { source: 'study-areas', id: hoveredStateId },
          { hover: true }
        );
      }

  });

  map.on('mouseleave', 'cities-hover', function () {
    if (hoveredStateId) {
      map.setFeatureState(
        { source: 'study-areas', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
  });

  map.on('mouseenter', 'cities-hover', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    var lng = e.features[0].properties.lbl_x;
    var lat = e.features[0].properties.lbl_y;
    var description = e.features[0].properties.name;

    // Populate the popup and set its coordinates
    // based on the feature found.
    // console.log(coordinates)
    popup.setLngLat([lng, lat]).setHTML(description).addTo(map);

  });

  map.on('mouseleave', 'cities-hover', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });

  // map.on('click', 'cities', function (e) {

    // var bounds = [
    //   e.features[0].properties.x1,
    //   e.features[0].properties.y1,
    //   e.features[0].properties.x2,
    //   e.features[0].properties.y2,
    // ]
    //
    // map.fitBounds(bounds, {
    //   padding: 20
    // });

  // });

  function buttonZoom() {

    map.setMaxBounds(null);

    $(".loc-button").removeClass("active")
    $(this).addClass("active")

    var bounds, maskFadeDir;
    if (this.id == "full-extent") {

      maskFadeDir = "out";
      bounds = [-91.267, 30.15, -90.725, 30.745]

    } else {
      maskFadeDir = "in";

      var lookup = {
        "north-br": "North Baton Rouge Study Area",
        "ds": "Denham Springs Study Area",
        "sorrento": "Sorrento Study Area",
        "baker": "Baker Study Area",
      }

      var name = lookup[this.id]
      studyAreasFeatures.forEach(function(feature) {
        if (feature.properties.name == name) {
          bounds = [
            feature.properties.x1,
            feature.properties.y1,
            feature.properties.x2,
            feature.properties.y2,
          ]
        }
      })
    }

    map.fitBounds(bounds, {
      padding: {top: 50, bottom:50, left: 50, right: 150}
    });

    map.once('moveend', freezeBounds)

    fadeMask(maskFadeDir)

  }
  $(".loc-button").click(buttonZoom)

});
