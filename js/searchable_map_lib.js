var SearchableMapLib = SearchableMapLib || {};
var SearchableMapLib = {

  // parameters to be defined on initialize() 
  map_centroid: [],
  defaultZoom: 9,
  filePath: '',
  fileType: '',
  csvOptions: '',
  listOrderBy: '',
  recordName: '',
  recordNamePlural: '',
  debug: false,

  // internal properties
  radius: '',
  csvData: null,
  geojsonData: null,
  currentResults: null,
  currentResultsLayer: null,
  currentPinpoint: null,
  selectedPoint: null,
  lastClickedLayer: null,

  initialize: function(options){
    options = options || {};

    SearchableMapLib.map_centroid = options.map_centroid || [41.881832, -87.623177],
    SearchableMapLib.defaultZoom = options.defaultZoom || 10,
    SearchableMapLib.filePath = options.filePath || "",
    SearchableMapLib.fileType = options.fileType || "csv",
    SearchableMapLib.csvOptions = options.csvOptions || {separator: ',', delimiter: '"'},
    SearchableMapLib.listOrderBy = options.listOrderBy || "",
    SearchableMapLib.recordName = options.recordName || "result",
    SearchableMapLib.recordNamePlural = options.recordNamePlural || "results",
    SearchableMapLib.radius = options.defaultRadius || 805,
    SearchableMapLib.debug = options.debug || false

    if (SearchableMapLib.debug)
      console.log('debug mode is on');

    // filters
    $("#search-address").val(SearchableMapLib.convertToPlainString($.address.parameter('address')));

    var loadRadius = SearchableMapLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") 
        $("#search-radius").val(loadRadius);
    else 
        $("#search-radius").val(SearchableMapLib.radius);

    $(":checkbox").prop("checked", "checked");
    
    var geocoder = new L.Control.OSMGeocoder();

    //geocoder = new google.maps.Geocoder();
    // initiate leaflet map
    if (!SearchableMapLib.map) {
      SearchableMapLib.map = new L.Map('mapCanvas', {
        center: SearchableMapLib.map_centroid,
        zoom: SearchableMapLib.defaultZoom,
        scrollWheelZoom: true,
        minZoom: 5
      });
	  
	  
	  
	  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(SearchableMapLib.map);
	  
	  
	  
      //SearchableMapLib.google = L.gridLayer.googleMutant({type: 'roadmap' });

      //SearchableMapLib.map.addLayer(SearchableMapLib.google);

      //add hover info control
      SearchableMapLib.info = L.control({position: 'bottomleft'});

      SearchableMapLib.info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      var hover_template;
      $.get( "https://adrireef.github.io/sandbox2/js/hover.ejs", function( template ) {
        hover_template = template;
      });
      SearchableMapLib.info.update = function (props) {
        if (props) {
          this._div.innerHTML = ejs.render(hover_template, {obj: props});
        }
        else {
          this._div.innerHTML = 'Hover over a ' + SearchableMapLib.recordName;
        }
      };

      SearchableMapLib.info.clear = function(){
        this._div.innerHTML = 'Hover over a ' + SearchableMapLib.recordName;
      };

      //add results control
      SearchableMapLib.results_div = L.control({position: 'topright'});

      SearchableMapLib.results_div.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'results-count');
        this._div.innerHTML = "";
        return this._div;
      };

      SearchableMapLib.results_div.update = function (count){
        var recname = SearchableMapLib.recordNamePlural;
        if (count == 1) {
            recname = SearchableMapLib.recordName;
        }

        this._div.innerHTML = count.toLocaleString('en') + ' ' + recname + ' found';
      };

      SearchableMapLib.results_div.addTo(SearchableMapLib.map);
      SearchableMapLib.info.addTo(SearchableMapLib.map);

      $.when($.get(SearchableMapLib.filePath)).then(
      function (data) {

        if (SearchableMapLib.fileType == 'geojson') {
          if (SearchableMapLib.debug) console.log('loading geojson');
          // sometimes the server returns the file as text and we have to parse it
          if (typeof data == 'string')
            SearchableMapLib.geojsonData = JSON.parse(data);
          else
            SearchableMapLib.geojsonData = data
        }
        else if (SearchableMapLib.fileType == 'csv' ){
          // convert CSV
          if (SearchableMapLib.debug) console.log('converting to csv');
          SearchableMapLib.geojsonData = convertCsvToGeojson(data)
        }
        else {
          // error!
          console.log ("fileType must be 'csv' or 'geojson'")
        }

        if (SearchableMapLib.debug) {
          console.log('data loaded:');
          console.log(SearchableMapLib.geojsonData);
        }

        SearchableMapLib.doSearch();

      });
    }
  },

  doSearch: function() {
    SearchableMapLib.clearSearch();
    var address = $("#search-address").val();
    SearchableMapLib.radius = $("#search-radius").val();

    if (SearchableMapLib.radius == null && address != "") {
      SearchableMapLib.radius = 805;
    }

    if (address != "") {

      
      
      geocoder.geocode( { 'address': address }, function(results, status) {
//        if (status == google.maps.GeocoderStatus.OK) {
          SearchableMapLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', SearchableMapLib.radius);
          SearchableMapLib.address = address;
          SearchableMapLib.createSQL(); // Must call create SQL before setting parameters.
          SearchableMapLib.setZoom();
          SearchableMapLib.addIcon();
          SearchableMapLib.addCircle();
          SearchableMapLib.renderMap();
          SearchableMapLib.renderList();
          SearchableMapLib.getResults();
        }
//        else {
//          alert("We could not find your address: " + status);
//        }
//      });
    }
    else { //search without geocoding callback
      SearchableMapLib.map.setView(new L.LatLng( SearchableMapLib.map_centroid[0], SearchableMapLib.map_centroid[1] ), SearchableMapLib.defaultZoom)
      SearchableMapLib.createSQL(); // Must call create SQL before setting parameters.
      SearchableMapLib.renderMap();
      SearchableMapLib.renderList();
      SearchableMapLib.getResults();
    }

  },
  
  
  //doSearch: function() {
    //SearchableMapLib.clearSearch();
    //var address = $("#search-address").val();
    //SearchableMapLib.radius = $("#search-radius").val();

    //if (SearchableMapLib.radius == null && address != "") {
      //SearchableMapLib.radius = 805;
    //}

    //if (address != "") {

      //geocoder.geocode( { 'address': address }, function(results, status) {
        //if (status == google.maps.GeocoderStatus.OK) {
          //SearchableMapLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          //$.address.parameter('address', encodeURIComponent(address));
          //$.address.parameter('radius', SearchableMapLib.radius);
          //SearchableMapLib.address = address;
          //SearchableMapLib.createSQL(); // Must call create SQL before setting parameters.
          //SearchableMapLib.setZoom();
          //SearchableMapLib.addIcon();
          //SearchableMapLib.addCircle();
          //SearchableMapLib.renderMap();
          //SearchableMapLib.renderList();
          //SearchableMapLib.getResults();
        //}
        //else {
          //alert("We could not find your address: " + status);
        //}
      //});
    //}
    //else { //search without geocoding callback
      //SearchableMapLib.map.setView(new L.LatLng( SearchableMapLib.map_centroid[0], SearchableMapLib.map_centroid[1] ), SearchableMapLib.defaultZoom)
      //SearchableMapLib.createSQL(); // Must call create SQL before setting parameters.
      //SearchableMapLib.renderMap();
      //SearchableMapLib.renderList();
      //SearchableMapLib.getResults();
    //}

  //},
  
  

  renderMap: function() {
    SearchableMapLib.currentResultsLayer.addTo(SearchableMapLib.map);
  },

  renderList: function() {
    var results = $('#results-list');
    results.empty();

    if (SearchableMapLib.currentResults.features.length == 0) {
      results.append("<p class='no-results'>No results. Please broaden your search.</p>");
    }
    else {
      var row_content;
      $.get( "https://adrireef.github.io/sandbox2/js/table-row.ejs", function( template ) {
          for (idx in SearchableMapLib.currentResults.features) {
            row_content = ejs.render(template, {obj: SearchableMapLib.currentResults.features[idx].properties});

            results.append(row_content);
          }
        });
      }
  },

  getResults: function() {
    if (SearchableMapLib.debug) {
      console.log('results length')
      console.log(SearchableMapLib.currentResults.features.length)
    }

    var recname = SearchableMapLib.recordNamePlural;
    if (SearchableMapLib.currentResults.features.length == 1) {
        recname = SearchableMapLib.recordName;
    }

    SearchableMapLib.results_div.update(SearchableMapLib.currentResults.features.length);

    $('#list-result-count').html(SearchableMapLib.currentResults.features.length.toLocaleString('en') + ' ' + recname + ' found')
  },
  
  modalPop: function(data) {
    if (SearchableMapLib.debug) {
      console.log('launch modal')
      console.log(data);
    }
    var modal_content;
    $.get( "https://adrireef.github.io/sandbox2/js/popup.ejs", function( template ) {
        modal_content = ejs.render(template, {obj: data});
        $('#modal-pop').modal();
        $('#modal-main').html(modal_content);
    });
  },

  clearSearch: function(){
    if (SearchableMapLib.currentResultsLayer) {
      SearchableMapLib.currentResultsLayer.remove();
    }
    if (SearchableMapLib.centerMark)
      SearchableMapLib.map.removeLayer( SearchableMapLib.centerMark );
    if (SearchableMapLib.radiusCircle)
      SearchableMapLib.map.removeLayer( SearchableMapLib.radiusCircle );
  },

  createSQL: function() {
    var address = $("#search-address").val();

    // this is a fun hack to do a deep copy of the GeoJSON data
    SearchableMapLib.currentResults = JSON.parse(JSON.stringify(SearchableMapLib.geojsonData));

    if(SearchableMapLib.currentPinpoint != null && address != '') {
        var point = turf.point([SearchableMapLib.currentPinpoint[1], SearchableMapLib.currentPinpoint[0]]);
        var buffered = turf.buffer(point, SearchableMapLib.radius, {units: 'meters'});

        SearchableMapLib.currentResults = turf.pointsWithinPolygon(SearchableMapLib.currentResults, buffered);

        if (SearchableMapLib.debug) {
          console.log('found points within')
          console.log(SearchableMapLib.currentResults);
        }
    }

 
    //-----custom filters-----
    
    //-----Bottom depth filter-----
    //slider definition
//	if ($('#sliderDepth').val() != '50') {
	if ($("#cbType6").is(':checked')) {
	var rangedepth = document.getElementById("sliderDepth"); 
	var defaultValDe = rangedepth.defaultValue;
	var currentValDe = rangedepth.value; 
	var output1 = document.getElementById("demo1"); 
	output1.innerHTML = rangedepth.value; 
  
	rangedepth.oninput = function() { 
	output1.innerHTML = this.value; 
	} 
	//data parsing
	//var customFilters = [];
	//if (defaultValDe == currentValDe) {
		////do nothing
	//} else {
		//customFilters.push('parseFloat(r.properties["min_depth_m"]) <= currentValDe');
	//}
	var customFilters = [];
	customFilters.push('parseFloat(r.properties["min_depth_m"]) <= currentValDe');
    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });
}
    //-----end Bottom depth filter-----
    
    
    //-----Distance from the coastline filter-----
    //slider definition
//	if ($('#sliderDistance').val() != '10') {
	if ($("#cbType7").is(':checked')) {
	var rangedistance = document.getElementById("sliderDistance"); 
	var defaultValDi = rangedistance.defaultValue;
	var currentValDi = rangedistance.value; 
	var output2 = document.getElementById("demo2"); 
	output2.innerHTML = rangedistance.value; 
  
	rangedistance.oninput = function() { 
	output2.innerHTML = this.value; 
	} 
	//data parsing
	//var customFilters = [];
	//if (defaultValDi == currentValDi) {
		////do nothing
	//} else {
		//customFilters.push('parseFloat(r.properties["Min_dist_filt_km"]) <= currentValDi');
	//}
	var customFilters = [];
	customFilters.push('parseFloat(r.properties["Min_dist_filt_km"]) <= currentValDi');
    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });
}
    //-----end Distance fromt he coastline filter-----
    

    //-----Reef type filter-----
    //filter on Reef type. constructing a list of OR statements based on what checkboxes are selected
    var customFilters = [];
    if ( $("#cbType1").is(':checked')) {
      customFilters.push('r.properties["type"] === "Natural reef"');
    }
    if ( $("#cbType2").is(':checked')) {
      customFilters.push('r.properties["type"] === "Artificial reef"');
    }
    if ( $("#cbType3").is(':checked')) {
      customFilters.push('r.properties["type"] === "Wreck"');
    }

    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });

    //-----end Reef type filter-----
    
	//-----Country filter-----
    //filter on country. constructing a list of OR statements based on what checkboxes are selected
    var customFilters = [];
    if ( $("#cbType4").is(':checked')) {
      customFilters.push('r.properties["Country"] === "Italy"');
    }
    if ( $("#cbType5").is(':checked')) {
      customFilters.push('r.properties["Country"] === "Croatia"');
    }
    if ( $("#cbType8").is(':checked')) {
      customFilters.push('r.properties["Country"] === "International waters"');
    }

    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });
    //-----end Country filter-----
    
    //-----Usage filter-----
    //filter on usage. constructing a list of AND statements based on what lines in the dropdown menu are selected
    if ($('#usages').val() != 'Select More') {
	
	for (var j = 0; j < $('#usages').val().length; j++) {
	var customFilters = [];	
	console.log($('#usages').val()[j])
	if ( $('#usages').val()[j] == 'Research') {
      customFilters.push('r.properties["exploitation"].match(/Research/g)');
    }
        
    if ( $('#usages').val()[j] == 'Professional fishery') {
      customFilters.push('r.properties["exploitation"].match(/Professional fishery/g)');
    }
    if ( $('#usages').val()[j] == 'Mariculture') {
	  //customFilters.push('r.properties["exploitation"] === "Snorkeling"');
	  customFilters.push('r.properties["exploitation"].match(/Mariculture/g)');
    }
    if ( $('#usages').val()[j] == 'Diving') {
      customFilters.push('r.properties["exploitation"].match(/Diving/g)');
    }
    if ( $('#usages').val()[j] == 'None') {
      customFilters.push('r.properties["exploitation"].match(/None/g)');
    }
    if ( $('#usages').val()[j] == 'Recreational fishery') {
      customFilters.push('r.properties["exploitation"].match(/Recreational fishery/g)');
    }

    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });
	}
	}
	//-----end Usage filter-----
    
    //-----Natural reef typology filter-----
    //filter on natural reef typology. constructing a list of AND statements based on what lines in the dropdown menu are selected
    if ($('#typologies').val() != 'Select More') {
	
	for (var j = 0; j < $('#typologies').val().length; j++) {
	var customFilters = [];	
	console.log($('#typologies').val()[j])
	
	if ( $('#typologies').val()[j] == 'Patch reef') {
      customFilters.push('r.properties["reef_typology"].match(/Patch reef/g)');
    }   
    if ( $('#typologies').val()[j] == 'Ledges') {
      customFilters.push('r.properties["reef_typology"].match(/Ledges/g)');
    }
    if ( $('#typologies').val()[j] == 'Low') {
	  customFilters.push('r.properties["reef_typology"].match(/Low/g)');
    }
    if ( $('#typologies').val()[j] == 'High') {
      customFilters.push('r.properties["reef_typology"].match(/High/g)');
    }
    if ( $("#cbType3").is(':checked')) {
      customFilters.push('r.properties["type"] === "Wreck"');
    }
    if ( $("#cbType2").is(':checked')) {
      customFilters.push('r.properties["type"] === "Artificial reef"');
    }

    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });
	}
	}
    //-----end Natural reef typology filter----- 
    
    //-----Artificial reef material filter-----
    //filter on artificial reef material. constructing a list of AND statements based on what lines in the dropdown menu are selected
    if ($('#materials').val() != 'Select One') {
	
	var customFilters = [];	
	console.log($('#materials').val())
	if ( $('#materials').val() == 'Concrete') {
      customFilters.push('r.properties["Material_simply"] === "Concrete"');
    }   
    if ( $('#materials').val() == 'Concrete & Other') {
      customFilters.push('r.properties["Material_simply"] === "Concrete & Other"');
    }
    if ( $('#materials').val() == 'Concrete, Polyethylene') {
	  customFilters.push('r.properties["Material_simply"] === "Concrete, Polyethylene"');
    }
    if ( $('#materials').val() == 'Concrete, Rocks, Steel/Iron') {
	  customFilters.push('r.properties["Material_simply"] === "Concrete, Rocks, Steel/Iron"');
    }
    if ( $('#materials').val() == 'Steel/Iron') {
	  customFilters.push('r.properties["Material_simply"] === "Steel/Iron"');
    }
    if ( $("#cbType3").is(':checked')) {
      customFilters.push('r.properties["type"] === "Wreck"');
    }
    if ( $("#cbType1").is(':checked')) {
      customFilters.push('r.properties["type"] === "Natural reef"');
    }

    SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
        var filter = "";
        for (var i = 0; i < customFilters.length; i++) { 
          filter += customFilters[i] + " || " 
        }
        filter = filter.substring(0, filter.length - 3);
        return eval(filter);
    });
	}
    //-----end Artificial reef material filter-----    
 
    //-----name search filter-----
    var name_search = $("#search-name").val().replace("'", "\\'");
    if (name_search != '') {
      SearchableMapLib.currentResults.features = $.grep(SearchableMapLib.currentResults.features, function(r) {
          return r.properties["Name"].toLowerCase().indexOf(name_search.toLowerCase()) > -1;
        });
    }
    //-----end name search filter-----

    // -----end of custom filters-----

    SearchableMapLib.currentResultsLayer = L.geoJSON(SearchableMapLib.currentResults, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, {icon: SearchableMapLib.getIcon(feature.properties["type"])} );
        },
        onEachFeature: onEachFeature
      }
    );

    //messy - clean this up later
    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: hoverFeature,
        mouseout: removeHover,
        click: modalPop
      });
    }

    function hoverFeature(e) {
      SearchableMapLib.info.update(e.target.feature.properties);
    }

    function removeHover(e) {
      SearchableMapLib.info.update();
    }

    function modalPop(e) {
		SearchableMapLib.selectedPoint= [e.target.feature.geometry.coordinates[1], e.target.feature.geometry.coordinates[0]];
		if (SearchableMapLib.selectedPoint != undefined) {SearchableMapLib.selectIcon();};
		SearchableMapLib.modalPop(e.target.feature.properties);
	}
  },

  setZoom: function() {
    var zoom = '';
    if (SearchableMapLib.radius >= 100000) zoom = 9;
    else if (SearchableMapLib.radius >= 50000) zoom = 10;
    else if (SearchableMapLib.radius >= 30000) zoom = 11;
    else if (SearchableMapLib.radius >= 10000) zoom = 12;
    else if (SearchableMapLib.radius >= 1000) zoom = 14;
    else zoom = 16;

    SearchableMapLib.map.setView(new L.LatLng( SearchableMapLib.currentPinpoint[0], SearchableMapLib.currentPinpoint[1] ), zoom)
  },

  selectIcon: function() {
	if (SearchableMapLib.selectedMark != undefined) { 
	SearchableMapLib.map.removeLayer(SearchableMapLib.selectedMark);
	};
    SearchableMapLib.selectedMark = new L.Marker(SearchableMapLib.selectedPoint, { icon: (new L.Icon({
            iconUrl: 'https://adrireef.github.io/sandbox2/img/marker-icon-yellow2.png',
            iconSize: [25,41],
            iconAnchor: [10, 32]
    }))});
    SearchableMapLib.selectedMark.addTo(SearchableMapLib.map);
  },


  addIcon: function() {
    SearchableMapLib.centerMark = new L.Marker(SearchableMapLib.currentPinpoint, { icon: (new L.Icon({
            iconUrl: '/img/blue-pushpin.png',
            iconSize: [32, 32],
            iconAnchor: [10, 32]
    }))});

    SearchableMapLib.centerMark.addTo(SearchableMapLib.map);
  },

  addCircle: function() {
    SearchableMapLib.radiusCircle = L.circle(SearchableMapLib.currentPinpoint, {
        radius: SearchableMapLib.radius,
        fillColor:'#1d5492',
        fillOpacity:'0.1',
        stroke: false,
        clickable: false
    });

    SearchableMapLib.radiusCircle.addTo(SearchableMapLib.map);
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
    return decodeURIComponent(text);
  },

  // -----custom functions-----
  getIcon: function(type){
    if (type == "Natural reef") return greenIcon;
    if (type == "Artificial reef") return blueIcon;
    if (type == "Wreck") return redIcon;
    return yellowIcon;
  },
  // -----end custom functions-----

}

  function printDiv() {
	var divToPrint=document.getElementById('modal-pop');
	var newWin=window.open('','Print-Window');
	newWin.document.open();
//	newWin.document.write('<html><body onload="window.print()"><pre style="white-space:nowrap; width:50%; background:white; line-height:0.5cm; text-align:justify; font-family:calibri,arial,sans-serif; padding:0 20px;">'+divToPrint.innerHTML+'</pre></body></html>');
	newWin.document.write('<html><body onload="window.print()">'+divToPrint.innerHTML+'</body></html>');
	newWin.document.close();
	setTimeout(function(){newWin.close();},10);
	}
