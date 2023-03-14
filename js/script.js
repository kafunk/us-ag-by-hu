// <== DEFINE ANEW EACH MAP ==>
  var crs = new L.Proj.CRS("EPSG:5070","+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs", {
    resolutions: [16384, 8192, 4096, 2048, 1024, 512, 256, 128], // zoom level resolutions
  });

  var thisMap = {
    type: 'choropleth',  // this template intended for choropleths only
    geo_type: 'Watershed',
    initOptions: {       // *< update as desired >*
      crs: crs,
      center: [39, -97.5], // decent for conterminous US
      zoom: 1.2,
      zoomDelta: 0.4
    },
    data: {
      main: {
        file: 'data/huc8_full_attr_4326.json', // watershed_ag/us_hu6_crops.json',
        source: 'The Environmental Protection Agency'
      },
      overlay: {
        file: 'data/states_boundary_lines_ne.json',
        source: 'Natural Earth'
      }
    },
    maxClasses: 6,     // *< update as desired >*
    sharedStyles: {    // *< update as desired >*
      main: {
        color: 'lightcoral',
    		weight: 0.5,
    		fillOpacity: 1,
    		fillColor: 'silver'
    	},
      overlay: {
        color: 'dimgray',
        opacity: 0.8,
        weight: 2,
        fill: false
      },
      mouseover: {
        color: 'gainsboro',
        fillColor: 'lightcoral',
        opacity: 0.8,
        fillOpacity: 0.9
      }
    },
    controls: {
      uiFormType: 'select',
      uiElementId: 'dropdown',
      legendSymbol: {
        left: '', // prepending
        right: '%' // trailing
      }
    },
    mainColorBounds: ['#d1ecd5','seagreen'],
    layers: {     // <*insert one object for each mappable layer*>
      'Fruit crop acreage': {
        attributeColumn: 'FRUIT_ACRES',
        legendText: 'Fruit crop land in acres per sq mi'
        // *< insert layer specific mouseOver styles object if desired >*
        // fillRange: added upon first rendering
        // classBreaks: added upon first rendering
      },
      'Vegetable crop acreage': {
        attributeColumn: 'VEG_ACRES',
        legendText: 'Vegetable crop land in acres per sq mi'
      },
      'Grain crop acreage': {
        attributeColumn: 'GRAIN_ACRES',
        legendText: 'Grain crop land in acres per sq mi'
      },
      'Cotton crop acreage': {
        attributeColumn: 'COTTON_ACRES',
        legendText: 'Cotton crop land in acres per sq mi'
      },
      'Fruit and veggie combined acreage': {
        attributeColumn: 'FRUIT_VEG_ACRES',
        legendText: 'Fruit and veggie crops combined in acres per sq mi'
      },
      'Grain and cotton combined acreage': {
        attributeColumn: 'GRAIN_COT_ACRES',
        legendText: 'Grain and cotton crops combined in acres per sq mi'
      },
      'Total combined acreage': {
        attributeColumn: 'TOTAL_ACRES',
        legendText: 'All crops combined in acres per sq mi'
      },
      'Fruit crop annual yield': {
        attributeColumn: 'FRUIT_YIELD',
        legendText: 'Fruit crop yield in tons per sq mi'
      },
      'Vegetable crop annual yield': {
        attributeColumn: 'VEG_YIELD',
        legendText: 'Vegetable crop yield in tons per sq mi'
      },
      'Grain crop annual yield': {
        attributeColumn: 'GRAIN_YIELD',
        legendText: 'Grain crop yield in tons per sq mi'
      },
      'Cotton crop annual yield': {
        attributeColumn: 'COTTON_YIELD',
        legendText: 'Cotton crop yield in tons per sq mi'
      },
      'Fruit and veggie combined annual yield': {
        attributeColumn: 'FRUIT_VEG_YIELD',
        legendText: 'Fruit and vegetable crop yield combined in tons per sq mi'
      },
      'Grain and cotton combined annual yield': {
        attributeColumn: 'GRAIN_COT_YIELD',
        legendText: 'Grain and cotton crop yield combined in tons per sq mi'
      },
      'Total combined annual yield': {
        attributeColumn: 'TOTAL_YIELD',
        legendText: 'Combined crop yield in tons per sq mi'
      }
    }
  };

// VARIABLE DECLARATION
  var defaults = {
		scrollWheelZoom: true, // false,
		zoomSnap: .1,
		dragging: true, // false,
		zoomControl: true, // false,
    normedBy: 'AREASQMI'
  }
  var selectedLayer = 'Total combined acreage',
      attributeVal = 'TOTAL_ACRES',
      normedBy = defaults.normedBy;
  var mapOptions = getOptions();

  // initialize Leaflet map
  var map = L.map('map', mapOptions);
  // tiles = **; // if using

  // add zoom control back in non-default position
  map.addControl(L.control.zoom({position:'bottomright'}));

// LOAD DATA / RUNTIME
  // AJAX REQUESTS
  var mainDataRequest = $.getJSON(thisMap.data.main.file),
      overlayRequest = $.getJSON(thisMap.data.overlay.file);

  $.when(mainDataRequest, overlayRequest)
    .then(function(mainData, overlayData) {

      // draw map using GeoJson data
      createMap(mainData, overlayData);

  }, function(err) {
    console.log(err)
  });

// FUNCTIONS
  function getOptions() {
    var options = defaults;
    for (var key in thisMap.initOptions) {
      options[key] = thisMap.initOptions[key];
    }
    return options;
  }

	function createMap(mainData,overlay) {

    // // add basemap if using
    // tiles.addTo(map);

    // store map layers using L.geoJson with filters; add geography to map
		var mainLayer = L.geoJson(mainData).addTo(map);

    // add overlayer (eg state boundary lines)
    var overlay = L.geoJson(overlay, {
      style: function(feature) {
        // fetch default overlay options
        return thisMap.sharedStyles.overlay;
      }
    }).addTo(map);

		// fit the map's bounds and zoom level using the dataLayer extent
		// map.fitBounds(mainLayer.getBounds(), {
		// 	paddingBottomLeft: [-25, -25] // push off bottom left for sake of legend
		// });

		addUi(); // add initial UI control to map
		addLegend(); // add blank legend
		updateMap(mainLayer); // add initial map content

	}

  function addUi() {

		// create new Leaflet UI control and position it top right
		var uiControl = L.control({ position: 'topright'} );

		// when control is added to map, use jQuery to grab it
		uiControl.onAdd = function(map) {
			// use Leaflet method to select HTML element with id 'ui-controls'
			return L.DomUtil.get("ui-controls");
		}

		// add the control to the map
		uiControl.addTo(map);

    L.DomUtil.removeClass(uiControl.getContainer(), "hidden");

	}

	function addLegend() {

		// create a new Leaflet control object, and position it bottom left
		var legendControl = L.control({ position: 'bottomleft' });

		// when the legend is added to the map
		legendControl.onAdd = function(map) {

			// use Leaflet method to select HTML element with id 'legend'
			var legend = L.DomUtil.get('legend');

			// disable scroll and click/touch on map when on legend
			// L.DomEvent.disableScrollPropagation(legend);
			// L.DomEvent.disableClickPropagation(legend);

			// return the selection to the caller
			return legend;
		};

		// add the empty legend div to the map
		legendControl.addTo(map);

    L.DomUtil.removeClass(legendControl.getContainer(), "hidden");

  }

  function updateMap(dataLayer) { // [called initially after geometry drawn, then again on WIDGET CHANGE EVENT such that colors can update without reloading geometry)

    // shorthand for accessing layer object
    var thisLayer = thisMap.layers[selectedLayer];

    determineStyles(thisLayer,dataLayer);

    // render (<selectedLayer>) by looping through each geography layer to update the color and tooltip info
    dataLayer.eachLayer(function(layer) {

      let style0 = getStyle0(thisLayer,layer.feature,dataLayer);

      // set the fill color of layer based on its normalized data value
      layer.setStyle(style0)

      // on mouseover event
      layer.on('mouseover', function() {
        this.setStyle(getMouseOn(layer.feature)); // .bringToFront();
      });

      // on mouseout event
      layer.on('mouseout', function() {
        // set the fill color of layer based on its normalized data value
        layer.setStyle(style0);
        // dataLayer.resetStyle(this); //.bringToBack();
      });

      // shorthand for accessing L.geoJson object properties
      var props = layer.feature.properties;

      // set up for default variable values for layers without requisite data
      var tooltipInfo = `<div class='tooltip'>
        <h6>${props["NAME"]} ${thisMap.geo_type}</h6>
        <span class='align-right'>${thisLayer.legendText}:</span>
      `;

      // determine whether requisite data exists to proceed with calculations
      if (props[attributeVal] !== null && props[normedBy] !== null) {

        // if so, calculate normalized data value for this feature of selected layer
        let normalizedVal = props[attributeVal] / props[normedBy];

        // assemble string sequence of info for tooltip
        tooltipInfo += (normalizedVal === 0) ? `<em class='emph-dark'> negligible</em>` : `<br><span>approx. </span><em class='emph-dark'>${+normalizedVal.toFixed(2)}</em>`;

      } else {
        tooltipInfo += `<em>No data available</em>`;
      }

      tooltipInfo += `</div>`;

      // bind a tooltip to the layer with geography-specific information
      layer.bindTooltip(tooltipInfo, {
        // sticky property so tooltip follows the mouse
        sticky: true,
        tooltipAnchor: [200, 200]
      });

    })

		updateLegend(thisLayer.fillRange,thisLayer.classBreaks); // update the legend content using breaks for current attribute

    // <--------- Listen in wait --------->
    // code triggered whenever form registers an interaction
    $(thisMap.controls.uiFormType + '[id=' + thisMap.controls.uiElementId + ']').change(function() {

      // update global variables according to chosen option
      selectedLayer = this.value; // shorthand
      attributeVal = thisMap.layers[selectedLayer].attributeColumn;
      normedBy = thisMap.layers[selectedLayer].normedByColumn || defaults.normedBy;

      // re-call updateMap(dataLayer) for appropriate value rendering
      updateMap(dataLayer);

    });

  }

  function determineStyles(currentLayer,allFeatures) {

    // Determine appropriate call breaks for selected data layer
    // if classBreaks have not already been determined and stored in layer object
    if (!currentLayer.classBreaks) currentLayer.classBreaks = getClassBreaks(allFeatures);

    // Determine appropriate color fill range for selected data layer
    // if fillRange has not already been determined and stored, do so now
    if (!currentLayer.fillRange) currentLayer.fillRange = chroma.scale(thisMap.mainColorBounds).mode('lch').colors(currentLayer.classBreaks.length);

    function getClassBreaks(dataLayer) {

    	// create empty Array for storing values
    	var values = [];

    	// loop through all geographies
      if (Array.isArray(dataLayer)) {

        dataLayer.forEach(feature => addValue(feature.properties));

      } else {

        dataLayer.eachLayer(function(layer) {
          addValue(layer.feature.properties);
      	});

      }

      // use ckmeans method from Simple Statistics js library to cluster similar content into groups
      var clusters = ss.ckmeans(values, thisMap.maxClasses);

      // capture lower and upper bounds of each cluster within another 2D array
      var breaks = [];

      clusters.forEach(function(cluster,i) {

        let val0 = cluster[0],
            val1 = (clusters[i+1]) ? clusters[i+1][0] : Math.ceil(clusters[i].pop());

        if (Math.ceil(val0) !== Math.ceil(val1)) breaks.push([+val0.toFixed(2),+val1.toFixed(2)]);

      });

      // return array of arrays with specified number of elements
      return breaks;

      function addValue(props) {

        // confirm attribute existence to avoid errors
        if (props[attributeVal] !== null && props[normedBy] !== null) {

          var value = props[attributeVal] / props[normedBy];

    		  values.push(value); // push the normalized value for each layer into the holding array

        }

      }

    }

  }

  function getStyle0(currentLayer,currentFeature,allFeatures) {

    let normalizedVal = currentFeature.properties[currentLayer.attributeColumn]/currentFeature.properties[currentLayer.normedByColumn || defaults.normedBy];

    let style0 = {...thisMap.sharedStyles.main,...{
      // color: currentLayer.stroke,
      fillColor: getFillColor(normalizedVal,currentLayer.fillRange,currentLayer.classBreaks)
    }};

    return style0;

  }

  function getFillColor(normalizedVal,fillRange,breaks) {
    for (var i = 0; i < breaks.length; i++) {
      if (normalizedVal <= breaks[i][1]) {
       return fillRange[i];
      }
    }
  }

  function getMouseOn(feature){
    var mouseOn = thisMap.sharedStyles.mouseover;
    if (thisMap.layers[selectedLayer].mouseover) {
      for (var key in thisMap.layers[selectedLayer].mousover) {
        options[key] = thisMap.layers[selectedLayer][key];
      }
    }
    return mouseOn;
  }

	function updateLegend(fillRange,breaks) {

		// select the legend, add a title, begin an unordered list and assign to a variable
		var legend = $('#legend').html("<h5>" + thisMap.layers[selectedLayer].legendText + "</h5>");

		// loop through the Array of classification break values
		for (var i = 0; i <= breaks.length - 1; i++) {

      var color = getFillColor(breaks[i][0],fillRange,breaks);

      // pair color swatch (within <span> tags) with text label
      // add left/right legend symbols only when specified/relevant
      legend.append(
				'<span style="background:' + color + '"></span> ' +
				'<label>' +
        // thisMap.controls.legendSymbol.left +
        (breaks[i][0]).toLocaleString() +
        ' &mdash; ' +
        // thisMap.controls.legendSymbol.left +
        (breaks[i][1]).toLocaleString() +
        // thisMap.controls.legendSymbol.right +
        '</label>'
      );

	  }

  }

  // ADD:
  // visualized yield w/r/t acreage
