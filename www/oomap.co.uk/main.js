proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

var debug = false;

//Constants
var prefix1 = "http://tiler1.oobrien.com/";
var prefix2 = "http://tiler2.oobrien.com/";
var prefix3 = "http://tiler3.oobrien.com/";
var defaultMapTitle = "OpenOrienteeringMap";
var defaultRaceDescription = "Race instructions";

var currentID = null;
var currentNumber = null;
var topID = 0;
var topNumber = 1;

var mapTitle = defaultMapTitle;
var mapTitleDisplay = mapTitle;
var raceDescription = defaultRaceDescription;
var mapStyleID = "streeto_global";
var mapStyleIDOnSource;
var paper;
var scale;
var tips;
var eventdate = "";
var fontSizeFromArr;
var mapID = "new";
var reqMapID = "new";
var select;


var controlsSF = [];
var controlsX = [];
var controls = [];

//OpenLayers single-instance objects
var olMap;
var args;
var layerMapnik;
var layerOrienteering;
var layerMapBorder;
var layerMapCentre;
var layerMapSheet;
var layerMapTitle;
var layerMapContent;
var layerSF;
var layerX;
var layerControls;
var titleFeature;
var dragControl;
var sheetCentreLL;
var newControlLL = [0, 0];
var mapBound;
var orienteeringAttribution;

//State
//initialzoom, placepaper, addcontrols 
var state = "initialzoom";
var controloptstate = "add";

function controlStyle(feature, resolution)
{
	return [ 
	new ol.style.Style({
		image: new ol.style.Circle({
			fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, 1)'}),
			radius: 2
		})
	}),
	new ol.style.Style({
		image: new ol.style.Circle ({
			stroke: new ol.style.Stroke({color: 'rgba(255,0,255,1)', width: 2}),
			radius: 15
		}),
		text: new ol.style.Text({
			  textAlign: "center",
			  font: "bold 24px arial, verdana, sans-serif",
			  text: feature.get('number'),
			  fill: new ol.style.Fill({color: 'rgba(255,0,255,1)'}),
			  offsetX: feature.get('xoff'),
			  offsetY: feature.get('yoff')
		})
	}) 
]};
 
var dotStyle = new ol.style.Style({
});
	
var sfStyle = new ol.style.Style({
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: 'rgba(255,0,255,1)', width: 2}),
		radius: 15
	}),
	text: new ol.style.Text({
          textAlign: "center",
          font: "bold 15px arial, verdana, sans-serif",
          text: "S/F",
          fill: new ol.style.Fill({color: 'rgba(255,0,255,1)'}),
          offsetX: 0,
          offsetY: 0
    })
});
	
var sfStyleOuter = new ol.style.Style({
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: 'rgba(255,0,255,1)', width: 2}),
		radius: 20
	})
});

var xStyle = new ol.style.Style({
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: 'rgba(255,0,0,1)', width: 0.5}),
		radius: 1
	}),
	text: new ol.style.Text({
          textAlign: "center",
          baseAlign: "middle",
          font: "18px arial, verdana, sans-serif",
          text: "X",
          fill: new ol.style.Fill({color: 'rgba(255,0,0,1)'}),
          offsetX: 0,
          offsetY: 0
    })
});

var marginStyle = new ol.style.Style({ 
	fill: new ol.style.Fill({ color: [255, 255, 255, 1]})
});

var sheetStyle  = new ol.style.Style({ 
	stroke: new ol.style.Stroke({ color: [0, 0, 0, 1], width: 1})
});

function titleStyle(feature, resolution)
{
	return [ 
	 new ol.style.Style({
		text: new ol.style.Text({ 
			text: feature.get('mapTitleDisplay'),
			textAlign: "left",
			textBaseline: "middle",
          	fill: new ol.style.Fill({color: 'rgba(0,0,0,1)'}),
			font: "italic " + feature.get('fontSizeFromArr') + "px arial, verdana, sans-serif",
          	offsetX: feature.get('xoff'),
          	offsetY: feature.get('yoff'),
		}) 
	})
]};


var contentStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: [200, 200, 200, 0.3]})

});
var centreStyle = new ol.style.Style({  	
	image: new ol.style.Circle({
		stroke: new ol.style.Stroke({color: 'rgba(0,0,255,1)', width: 1}),
		fill: new ol.style.Stroke({color: 'rgba(0,0,255,0.5)'}),
		radius: 5
	})
});

var keys = ['unused', 'mapID', 'mapStyleID', 'zoom', 'lon', 'lat'];
args = [];

function setDefaults()
{
	/* Specified by user in URL. */
	var hash = window.location.hash;

	if (hash.length > 0)
	{
		var elements = hash.split('#');
		var pieces = elements[1].split('/');
		for(var i = 0; i < keys.length; i++)
		{
			if (pieces[i])
			{
				args[keys[i]] = pieces[i];			
			}
		}
		if (args['zoom']) { args['zoom'] = parseInt(args['zoom']); }
		if (args['lon']) { args['lon'] = parseFloat(args['lon']); }
		if (args['lat']) { args['lat'] = parseFloat(args['lat']); }
	}
}

//var controlsClick  = new OpenLayers.Control.ControlsClick();

/* Initialisation */

function init() 
{
	$( "#mapstyle" ).buttonset();
			
	$( "#mapscale" ).buttonset();
	$( "#papersize" ).buttonset();
	$( "#paperorientation" ).buttonset();

	$("#portrait").button( { icons: {primary:'ui-icon-document'} } );
	$("#landscape").button( { icons: {primary:'ui-icon-document-b'} } );

	$( "#c_type" ).buttonset();
	$( "#c_score" ).buttonset();

	$( "#mapstyle input[type=radio]" ).change(handleStyleChange);
	$( "#mapscale input[type=radio]" ).change(handleOptionChange);
	$( "#papersize input[type=radio]" ).change(handleOptionChange);
	$( "#paperorientation input[type=radio]" ).change(handleOptionChange);
	$( "#c_type input[type=radio]" ).change(handleControlTypeChange);

	$( "#createmap" ).button({ icons: { primary: "ui-icon-disk" } }).click(function() { handleGenerateMap(); });
	$( "#createclue" ).button().click(function() { handleGenerateClue(); });
	$( "#deletesheet" ).button({ icons: { primary: "ui-icon-trash" } }).click(function() { handleDeleteSheet(); });
	$( "#deleteXs" ).button({ icons: { primary: "ui-icon-trash" } }).click(function() { handleDeleteXs(); });
	$( "#getPostboxes" ).button({ icons: { primary: "ui-icon-pin-s" } }).click(function() { handleGetPostboxes(); });
	$( "#getOpenplaques" ).button({ icons: { primary: "ui-icon-pin-s" } }).click(function() { handleGetOpenplaques(); });

	$( "#createmap" ).button("disable");
	$( "#createclue" ).button("disable");
	$( "#deletesheet" ).button("disable");
	$( "#deleteXs" ).button("disable");
	$( "#getPostboxes" ).button("disable");
	$( "#getPlaques" ).button("disable");

	$( "#edittitle" ).click(function() { handleTitleEdit(); })	
	$( "#editinstructions" ).click(function() { handleRaceDescriptionEdit(); }) 

	$( "#eventdate").datepicker({
		dateFormat: "D d M yy",
      	altField: "#eventdate_alternate",
      	altFormat: "yy-mm-dd",
    });

    tips = $( ".validateTips" );	
    
	setDefaults();

	var currentLat = 51.1;
	var currentLon = -0.1;
	var currentZoom = 4; 
	var minZoom = 1;
	
	if (country == "ioa")
	{
		minZoom = 7;
		mapStyleID = "streeto_ioa";	
	}	
	if (country == "bof")
	{
		minZoom = 7;
		mapStyleID = "streeto";
	}
	if (country == "blueprint")
	{
		mapStyleID = "blueprint";
	}

	if (args['zoom'])
	{
		currentZoom = args['zoom'];
	}
	else
	{
		if (country == "ioa" || country == "bof")
		{
			currentZoom = 8;
		}	
	}
	if (args['lat'] && args['lon'])
	{
		currentLat = parseFloat(args['lat']); /* Necessary for lat (only) for some reason, otherwise was going to 90-val. Very odd... */
		currentLon = parseFloat(args['lon']);		
	}
	else
	{
		if (country == "ioa")
		{
			currentLat = 52.9;
			currentLon = -8.3;
		}
		else if (country == "bof")
		{
			currentLat = 51.8;
			currentLon = -0.9;		
		}	
	}
	if (args['mapID'])
	{
		reqMapID = args['mapID'];
	}

 	layerMapnik = new ol.layer.Tile({ title: "OpenStreetMap", source: new ol.source.OSM()});
	layerOrienteering = new ol.layer.Tile();
	layerMapBorder = new ol.layer.Vector({ title: "mapborder", style: marginStyle, source: new ol.source.Vector({}) });
	layerMapCentre = new ol.layer.Vector({ title: "mapcentre", style: centreStyle, source: new ol.source.Vector({}) });
	layerMapSheet = new ol.layer.Vector({ title: "mapsheet", style: sheetStyle, source: new ol.source.Vector({}) });
	layerMapTitle = new ol.layer.Vector({ title: "maptitle", style: titleStyle, source: new ol.source.Vector({}) });
	layerMapContent = new ol.layer.Vector({ title: "mapcontent", style: contentStyle, source: new ol.source.Vector({}) });
	layerSF = new ol.layer.Vector({ title: "controlsSF", style: [ sfStyle, sfStyleOuter], source: new ol.source.Vector({}) });
	layerX = new ol.layer.Vector({ title: "controlsX", style: xStyle, source: new ol.source.Vector({}) });
	layerControls = new ol.layer.Vector({ title: "controls", style: controlStyle, source: new ol.source.Vector({}) });

	orienteeringAttribution = new ol.Attribution({ 'html': 'Copyright OpenStreetMap contributors and OS Crown Copyright & Database Right Ordnance Survey 2016.'});

	if (args['mapStyleID'])
	{
		mapStyleID = args['mapStyleID'];
 	}
	$('#' + mapStyleID).prop('checked', true);
	$('#mapstyle').buttonset('refresh');

 	var theRestrictedExtent = undefined;
 	if (country == "ioa" || country == "bof")
	{
 		theRestrictedExtent = ol.proj.transformExtent([-12, 47, 8, 63], "EPSG:4326", "EPSG:3857");
	}

	if (country == "blueprint")
	{
		mapTitle = "Blueprint";
	}
	
	select = new ol.interaction.Select({
		layers: [layerMapCentre]
	});

     var translate = new ol.interaction.Translate({
   			features: select.getFeatures()
   	   });
   	   
   	 translate.on('translateend', handleDrag)

	
	olMap = new ol.Map( 
	{
		target: "map",
		layers: 
		[
			layerMapnik,
			layerOrienteering,
	  		layerMapBorder, 
	  		layerMapContent, 
	  		layerMapSheet, 
	  		layerMapTitle,
	  		layerMapCentre, 
	  		layerSF, 
	  		layerX, 
	  		layerControls		
		],

		controls: ol.control.defaults({ }).extend(
		[
			new ol.control.ScaleLine({'geodesic': true, 'units': 'metric'})		
		]),
		view: new ol.View({
			projection: "EPSG:3857",
			maxZoom: 17,
			minZoom: minZoom,
			zoom: currentZoom,
			center: ol.proj.transform([currentLon, currentLat], "EPSG:4326", "EPSG:3857"),
			extent: theRestrictedExtent
		}),
		interactions: ol.interaction.defaults().extend([select, translate]),
	});	
    
 	olMap.getView().on('change:resolution', handleZoom);
	olMap.on("moveend", updateUrl);

	olMap.on("singleclick", function(evt) {
		handleClick(evt);	
	});

	/* TODO - interactions here with both the sheetCentre control (drag it) and the controls themselves (bring up box) 
	dragControl = new OpenLayers.Control.DragFeature(layerMapCentre, { 
		onComplete: function(feature, pixel) { 
			dragControl.deactivate();
			sheetCentreLL = [feature.geometry.getCentroid().x, feature.geometry.getCentroid().y];
			rebuildMapSheet();
		} 
	});
	map.addControl(dragControl);
	dragControl.activate();
	
	map.addControl(controlsClick);
	controlsClick.activate();
	*/



	handleZoom();	
	updateUrl();
	initDescriptions();
	if(!!document.createElement('canvas').getContext)	
	{
		$( ".knob" ).knob({
		'width':65,
		'fgColor':"#222222",
		'cursor':30,
		'thickness':0.3,
		'min':0,
		'max':360,
		'height':65,
		'release' : function (v) { }
		});		    
	}
	var c_number = $( "#c_number" ),
      allFields = $( [] ).add( c_number );
      
    function checkNumber( o, n, type ) 
    {
    	if (type == "c_startfinish" || type == "c_cross")
    	{
    		return true;
    	}
    
		if (o.val() == null || o.val().length < 1)
		{
			o.addClass( "ui-state-error" );
			updateTips( "You must enter a number." );
			return false;      		
		}     
		for(var i = 0; i < controls.length; i++)
		{
			if (o.val() == controls[i].number && o.val() != currentNumber)
			{
				o.addClass( "ui-state-error" );
				updateTips( "This number has already been used." );
				return false;
			}
		}
		return true;
	}
           
	$( "#newcontroloptions" ).dialog({
	  autoOpen: false,
	  height: 350,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  var bValid = true;
		  allFields.removeClass( "ui-state-error" );

		  bValid = bValid && checkNumber( c_number, "Number", $("#c_type :radio:checked").attr("id"));

		  if ( bValid ) {
		  	var control = new Object();
		  	
		  	control.id = topID++;
		  	
		  	control.number = c_number.val();
			if (!isNaN(parseInt(control.number))) 
			{
				control.number = parseInt(control.number);
				if (control.number > topNumber) 
				{ 
					topNumber = control.number; 
				} 
			}  	
		  	
		  	control.angle = $("#c_angle").val();
			control.angle = parseInt(control.angle);	

			control.score = $("#c_score :radio:checked").val();
			control.score = parseInt(control.score);	
			//control.score_id = $("#c_score :radio:checked").attr("id");

			control.type = $("#c_type :radio:checked").attr("id");

			control.description = $("#c_description").val();

			control.lat = newControlLL[1]; 
			control.lon = newControlLL[0];

			control.wgs84lat = ol.proj.transform([control.lon, control.lat], "EPSG:3857", "EPSG:4326")[1];
			control.wgs84lon = ol.proj.transform([control.lon, control.lat], "EPSG:3857", "EPSG:4326")[0];
			
			if (control.type == "c_startfinish") 
			{	
				control.score = 0;

				//Delete any existing S/F control	
				controlsSF = [];
				controlsSF.push(control);	
  			}
  			else if (control.type == "c_cross")
  			{
  				if (controloptstate == "new")
  				{
  					controlsX.push(control);	  			
				}
				else if (controloptstate == "edit")
				{
					for (var i = 0; i < controlsX.length; i++)
					{
						if (currentID == controlsX[i].id)
						{
							controlsX[i] = control;
						} 
					}
				}
  			}
  			else
  			{
  				if (controloptstate == "new")
  				{
  					controls.push(control);	  			
				}
				else if (controloptstate == "edit")
				{
					for (var i = 0; i < controls.length; i++)
					{
						if (currentID == controls[i].id)
						{
							controls[i] = control;
						} 
					}
				}
  			}
  			
			if (mapID != "new")
			{
				mapID = "new";
				updateUrl();
			}

		  	rebuildMapControls();
		  	rebuildDescriptions();
		  		  
			$( this ).dialog( "close" );
		  }
		},
		Cancel: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	
	$( "#setmaptitle" ).dialog({
	  autoOpen: false,
	  height: 350,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  
		    mapTitle = $("#s_maptitle").val();		  	
		  	initDescriptions();
	  		if (state == "addcontrols" || state == "zoom")
			{			
			if (mapID != "new")
				{
					mapID = "new";
					updateUrl();
				}

				rebuildMapSheet();	
			}			
		  		  
			$( this ).dialog( "close" );
		},
		Cancel: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	
	$( "#setracedescription" ).dialog({
	  autoOpen: false,
	  height: 350,
	  width: 700,
	  modal: true,
	  buttons: {
		OK: function() 
		{
			if (mapID != "new")
			{
				mapID = "new";
				updateUrl();
			}

		    raceDescription = $("#s_racedescription").val();		  	
		  	initDescriptions();		  		  
			$( this ).dialog( "close" );
		},
		Cancel: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	
	$( "#saving" ).dialog({
	  autoOpen: false,
	  height: 140,
	  modal: true
	});
	$( "#saveerror" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		"Create anyway": function() {
		  	mapID = "new";
			generateMap();
			$( this ).dialog( "close" );
		},
		Cancel: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	$( "#validationerror" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		"Save and create anyway": function() {
			saveMap();
			$( this ).dialog( "close" );
		},
		Cancel: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	$( "#generating" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	$( "#loaderror" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});	
	$( "#postcode_searching" ).dialog({
	  autoOpen: false,
	  height: 140,
	  modal: true
	});
	$( "#postcode_error" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});	
	$( "#postboxes_searching" ).dialog({
	  autoOpen: false,
	  height: 140,
	  modal: true
	});
	$( "#postboxes_error" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});	
	$( "#openplaques_searching" ).dialog({
	  autoOpen: false,
	  height: 140,
	  modal: true
	});
	$( "#openplaques_error" ).dialog({
	  autoOpen: false,
	  height: 300,
	  width: 500,
	  modal: true,
	  buttons: {
		OK: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});	
	$( "#cluesheet" ).dialog({
	  autoOpen: false,
	  height: 700,
	  width: 900,
	  modal: true,
	  buttons: {
		"Print clue sheet": function() {		  
			$(this).jqprint();
		},
		Close: function() {
		  $( this ).dialog( "close" );
		}
	  }
	});
	
	$("#search").submit(function() { handleSearchPostcode(); return false });
	$("#load").submit(function() { handleLoadMap(); return false; });
	
	$( "#searchButton" ).button().css('font-size', 10);
	$( "#loadButton" ).button().css('font-size', 10);
	
	//Handle loading in a map with ID.
	if (reqMapID != "new")
	{
		$.post('/load.php', {"shortcode":reqMapID}, handleLoadCallback);
	}	
}

function updateTips( t ) {
  tips
	.text( t )
	.addClass( "ui-state-highlight" );
  setTimeout(function() {
	tips.removeClass( "ui-state-highlight", 1500 );
  }, 500 );
}

/* Resetting and reinitialisation */

function initDescriptions()
{

	$( ".edit").button({ icons: { primary: "ui-icon-pencil" }, text: false });		    
	$( ".delete").button({ icons: { primary: "ui-icon-trash" }, text: false });	
	
	$("#maptitle").text(mapTitle);
	$("#racedescription").text(raceDescription);
}

function resetControlAddDialog(pid)
{
	$("#c_angle").trigger('configure', { "readOnly":false });
	$("#c_score input[type=radio]").button("enable");
	$("#c_number").removeAttr('disabled');
	$("#c_description").removeAttr('disabled');

	$('[for=c_regular]').click(); //Overlying label
	$("#c_regular").click(); //Underlying button
	
	if (pid != null)
	{
		var control;
		for (var i = 0; i < controls.length; i++)
		{
			if (controls[i].id == parseInt(pid.substring(1)))
			{
				control = controls[i];
				break;
			}
		}
		$("#c_angle").val(control.angle).trigger('change');

		$('[for=c_score' + control.score + ']').click(); //Overlying label
		$("#c_score" + control.score).click(); //Underlying button
		$("#c_number").val(control.number);
		$("#c_description").val(control.description);
		
		newControlLL = [control.lon, control.lat];		
	}
	else
	{		
		$("#c_angle").val(45).trigger('change');
		//$("#c_score").val(10); //Don't change this - useful to keep current value.
		$("#c_number").val("");
		$("#c_description").val("");
	}
}

/* Deal with user actions */

function handleControlTypeChange()
{
	var type = $("#c_type :radio:checked").attr("id");
	if (type == "c_startfinish" || type == "c_cross")
	{
		$("#c_angle").val(45).trigger('change');
		//$("#c_score").val(10); //Don't change this - useful to keep current value.
		$("#c_number").val("");
		$("#c_description").val("");

		$("#c_angle").trigger('configure', { "readOnly":true });
		$("#c_score input[type=radio]").button("disable");
		$("#c_number").attr('disabled','disabled');
		$("#c_description").attr('disabled','disabled');
	}
	else
	{
		$("#c_angle").trigger('configure', { "readOnly":false });
		$("#c_score input[type=radio]").button("enable");
		$("#c_number").removeAttr('disabled');
		$("#c_description").removeAttr('disabled');

	}
}

function handleStyleChange()
{
	mapStyleID = $("#mapstyle :radio:checked").attr("id"); 
	handleZoom();
	updateUrl();
}

function handleZoom()
{
	if (debug) { console.log('handleZoom'); }
	if (!olMap)
	{
		return;
	}
	
	$( "#createmap" ).button("disable");
	$( "#deletesheet" ).button("disable");
	$( "#deleteXs" ).button("disable");
	$( "#getPostboxes" ).button("disable");	
	$( "#getOpenplaques" ).button("disable");	

	if (controlsX.length > 0)
	{
		$( "#deleteXs" ).button("enable");
	}
	
	if (olMap.getView().getZoom() != parseInt(olMap.getView().getZoom()))
	{
		olMap.getView().setZoom(Math.round(olMap.getView().getZoom()));
	}
	
	if (olMap.getView().getZoom() < 12)
	{
		if (state == "placepaper")
		{
			state = "initialzoom";
			$("#messageCentre").hide();
			$("#messageZoom").show("pulsate", {}, 500);
		}
		else if (state == "addcontrols")
		{
			state = "zoom";
			$("#messageAdd").hide();
			$("#messageZoom").show("pulsate", {}, 500);
			rebuildMapSheet();
		}		
		layerMapnik.setVisible(true);
		layerOrienteering.setVisible(false);
	}
	else
	{
		if (state == "initialzoom")
		{
			state = "placepaper";
			$("#messageZoom").hide();
			$("#messageAdd").hide();
			$("#messageCentre").show("pulsate", {}, 500);					
		}
		else if (state == "zoom")
		{
			state = "addcontrols";
			$("#messageZoom").hide();
			$("#messageCentre").hide();
			$("#messageAdd").show("pulsate", {}, 500);	
			rebuildMapSheet();		
		}
		else if (state == "addcontrols")
		{
			$("#messageCentre").hide();
			rebuildMapSheet();		
		}
		if (country == "blueprint")
		{
			mapStyleID = "blueprint";
		}
		else
		{
			mapStyleID = $("#mapstyle :radio:checked").attr("id"); 
		}

		if (mapStyleIDOnSource != mapStyleID)
		{
			layerOrienteering.setSource(new ol.source.XYZ({ urls: [prefix1 + mapStyleID + "/{z}/{x}/{y}.png", prefix2 + mapStyleID + "/{z}/{x}/{y}.png", prefix3 + mapStyleID + "/{z}/{x}/{y}.png"], attributions: [ orienteeringAttribution ]}));
			mapStyleIDOnSource = mapStyleID;	
		}
		layerMapnik.setVisible(false);
		layerOrienteering.setVisible(true);
	}
	//updateUrl();
}

function handleControlEditOptions(pid)
{
			controloptstate = "edit";
			currentID = parseInt(pid.substring(1));
			currentNumber = null;
			for (var i = 0; i < controls.length; i++)
			{
				var control = controls[i];
				if (control.id == currentID)
				{
					currentNumber = control.number;
					newControlLL = [control.lon, control.lat];		
					break;
				}	
			}	
			$( "#newcontroloptions" ).dialog( "open" );
			resetControlAddDialog(pid);
}

function handleControlDelete(pid)
{
	currentID = parseInt(pid.substring(1));
	for (var i = 0; i < controls.length; i++)
	{
		if (currentID == controls[i].id)
		{
			controls.splice(i, 1);
			break;
		} 
	}
	for (var i = 0; i < controlsX.length; i++)
	{	
		if (currentID == controlsX[i].id)
		{
			controlsX.splice(i, 1);
			break;
		} 
	}

	if (mapID != "new")
	{
		mapID = "new";
		updateUrl();
	}
	
	rebuildMapControls();
	rebuildDescriptions();
}

function handleDeleteSheet()
{
	layerMapBorder.getSource().clear();
	layerMapCentre.getSource().clear();
	layerMapSheet.getSource().clear();
	layerMapTitle.getSource().clear();
	layerMapContent.getSource().clear();

	controls = [];
	controlsSF = [];
	controlsX = [];
	
	topID = 0;
	topNumber = 1;
	
	rebuildMapControls();
	rebuildDescriptions();
	state = "initialzoom";
	handleZoom();

	if (mapID != "new")
	{
		mapID = "new";
	}
	updateUrl();


	$( "#deletesheet" ).button("disable");
	$( "#getPostboxes" ).button("disable");	
	$( "#getOpenplaques" ).button("disable");	
}

function handleDeleteXs()
{
	if (mapID != "new")
	{
		mapID = "new";
		updateUrl();
	}
	controlsX = []; 
	rebuildMapControls();
	$( "#deleteXs" ).button("disable");

}

function handleTitleEdit()
{
	$( "#setmaptitle" ).dialog( "open" );
	$("#s_maptitle").val(mapTitle);
	updateTips("Tip: Long titles will be reduced in size when creating sheet.");
}

function handleRaceDescriptionEdit()
{
	$( "#setracedescription" ).dialog( "open" );
	$("#s_racedescription").val(raceDescription);
	updateTips("Tip: The race instructions will appear at the top of the clue sheet. Please do not place any personal information here (e.g. phone numbers) as it may be publically visible in future versions of OpenOrienteeringMap.");
}

function handleLoadMap()
{
	reqMapID = $("#savedMapID").val();
	$.post('/load.php', {"shortcode":reqMapID}, handleLoadCallback);
}

function handleGenerateMap()
{
	$("#saved_mapid").html("");
	$("#saveerror_text").html("");
	$("#validationerror_text").html("");
	
	if (validate())
	{
		saveMap();
	}
}	

function validate()
{
	var validationMsg = "";

	if (mapTitle == defaultMapTitle)
	{
		validationMsg += "Map title not changed from default.<br />";
	} 
	if (raceDescription == defaultRaceDescription)
	{
		validationMsg += "Race instructions not changed from default.<br />";
	} 

	var currScore = 0;
	for (var i = 0; i < controls.length; i++)
	{
		var control = controls[i];
		if (control.score < currScore)
		{
			validationMsg += "One or more controls with higher number but lower score.<br />";			
			break;
		}
		currScore = control.score;
	}

	var controlNumbers = [];
	for (var i = 0; i < controls.length; i++)
	{
		var control = controls[i];
		if ($.inArray(control.number, controlNumbers) > -1 && control.type != "c_startfinish" && control.type != "c_cross")
		{		
			validationMsg += "Two or more controls have the same number.<br />";	
			if (debug) { console.log(controlNumbers); console.log(control.number); }
			break;
		}
		controlNumbers.push(control.number);
	}
		
	if (validationMsg != "")
	{
		$( "#validationerror" ).dialog( "open" );	
		$("#validationerror_text").html(validationMsg);	
		return false;
	}
	else
	{
		return true;
	}
}

function handleDrag()
{
	if (debug) { console.log('handleDrag'); }
	//sheetCentreLL = ol.proj.transform([parseFloat(data.centre_lon), parseFloat(data.centre_lat)], "EPSG:4326", "EPSG:3857");
	sheetCentreLL = (layerMapCentre.getSource().getFeatures()[0]).getGeometry().getFirstCoordinate(); 
	select.getFeatures().clear()
	rebuildMapSheet()
}

function handleSaveCallback(json)
{
	$( "#saving" ).dialog( "close" );
	var result = JSON.parse(json);
	if (result.success)
	{
		$( "#generating" ).dialog( "open" );
		$("#saved_mapid").html("Your map ID (" + result.message + ") is printed at the bottom right. Use this ID if you wish to reload the map in the future.");
		mapID = result.message;
		updateUrl();
		if (debug) { console.log(result.data); }
		generateMap();
	}	
	else
	{
		$( "#saveerror" ).dialog( "open" );
		$( "#saveerror_text" ).html(result.message);
	}
}

function handleLoadCallback(json)
{
	$("#loaderror_text").html("");
	
	var result = JSON.parse(json);
	if (result.success)
	{
		if (debug) { console.log(result.data); }
		loadMap(result.data);
	}	
	else
	{
		$( "#loaderror" ).dialog( "open" );
		$( "#loaderror_text" ).html(result.message);
	}
}
	
function handleGenerateClue()
{
	//TODO Do warning that this action does not save - person needs to press Create Map Sheet. 
	$( "#cluesheet" ).dialog( "open" );

	$("#cs_title").html(mapTitle);
	$("#cs_raceinstructions").html(raceDescription);
	
	$("#cs_controls tr").remove();
	
	$("#cs_controls").find('tbody')
		.append($('<tr>')
			.append($('<th>').append('No'))
			.append($('<th>').append('Score'))
			.append($('<th>').append('Description'))
			.append($('<th>').append('Answer'))
		);

	var currentScore = 0;
	var emphasise = false;
	for (var i = 0; i < controls.length; i++)
	{
		var control  = controls[i];
		if (currentScore != control.score && currentScore != 0)
		{
			emphasise = true;
		}
		else
		{
			emphasise = false;		
		}
		currentScore = control.score;
		
		if (emphasise)
		{
			$("#cs_controls").find('tbody')
				.append($('<tr>').addClass('cs_spacer')
					.append($('<td>')
						.append(control.number).css('width', '50').css('fontWeight', 'bold')
					  )
					.append($('<td>')
						.append(control.score).css('width', '50')
					  )
					.append($('<td>')
						.append(control.description).css('textAlign', 'left')
					  )    
					.append($('<td>').css('width', '100')
					  )    
				);		
		}
		else
		{
			$("#cs_controls").find('tbody')
				.append($('<tr>')
					.append($('<td>')
						.append(control.number).css('width', '50').css('fontWeight', 'bold')
					  )
					.append($('<td>')
						.append(control.score).css('width', '50')
					  )
					.append($('<td>')
						.append(control.description).css('textAlign', 'left')
					  )    
					.append($('<td>').css('width', '100')
					  )    
				);
		}
	}
}

//TODOs
//About/Comments/attribution links.

//Missing features from this version:
//Label overlay
//Aerial imagery overlay
//lat/lon jump.

function handleOptionChange()
{
	//console.log(state);
	if (state == "initialzoom")
	{
		$("#messageZoom").effect("pulsate", {}, 500);
		return;
	}
	if (state == "addcontrols" || state == "zoom")
	{
		if (mapID != "new")
		{
			mapID = "new";
			updateUrl();
		}

		rebuildMapSheet();	
		return;
	}			
}

function handleClick(evt)
{
	var centreClick = false;
	var pixel = evt.pixel;
	olMap.forEachFeatureAtPixel(pixel, function(feature, layer) 
	{
		if (feature && layer.get('title') == "mapcentre")
		{
			centreClick = true;
		}
	});
	
	if (centreClick) 
	{ 
		if (debug) { console.log('returning'); }
		return; 
	}

	//console.log(state);
	if (state == "addcontrols")
	{
    	var coordinate = evt.coordinate;
		newControlLL = coordinate;
		if (!(new ol.geom.Point(newControlLL).intersectsExtent(mapBound)))
		{
			$( "#newcontroloutsidemap" ).dialog({
			  modal: true,
			  buttons: {
				Ok: function() {
				  $( this ).dialog( "close" );
				}
			  }
			});
		}
		else
		{
			controloptstate = "new";
			$( "#newcontroloptions" ).dialog( "open" );
			resetControlAddDialog(null);
		}
		return;
	}
			
	if (state == "initialzoom" || state == "zoom")
	{
		$("#messageZoom").effect("pulsate", {}, 500);
		return;
	}
	
	if (state == "placepaper")
	{
		if (mapID != "new")
		{
			mapID = "new";
			updateUrl();
		}

		sheetCentreLL = evt.coordinate;
		rebuildMapSheet();	
		state = "addcontrols";
		$("#messageCentre").hide();
		$("#messageAdd").effect("pulsate", {}, 500);
	}
}

/* Actions */

function saveMap()
{
	if (mapID != "new")
	{
		$( "#generating" ).dialog( "open" );
		generateMap();
	}
	var controlsForDB = controls.concat(controlsSF).concat(controlsX);

	var json = {"data":{
		"action": "savemap",
		"title": mapTitle,
		"race_instructions": raceDescription,
		"eventdate": $('#eventdate_alternate').val(),
		"club": $('#club').val(),
		"style": mapStyleID, 
		"scale": $("#mapscale :radio:checked").attr("id"), 
		"papersize": $("#papersize :radio:checked").attr("id"), 
		"paperorientation": $("#paperorientation :radio:checked").attr("id"), 
		"centre_lat": sheetCentreLL[1],
		"centre_lon": sheetCentreLL[0],
		"centre_wgs84lat": ol.proj.transform(sheetCentreLL, "EPSG:3857", "EPSG:4326")[1],
		"centre_wgs84lon": ol.proj.transform(sheetCentreLL, "EPSG:3857", "EPSG:4326")[0],
		"controls": controlsForDB
	}};

	$.post('/save.php', json, handleSaveCallback);
	$( "#saving" ).dialog( "open" );
}
	
function generateMap()
{
	//Construct the URL to the PDF.
	var escapeTitleText = escape(mapTitle);

	var startText = ""
	var xText = "";
	if (controlsSF.length > 0)
	{
		startText = controlsSF[0].lat.toFixed(0) + "," + controlsSF[0].lon.toFixed(0);
	}
	if (controlsX.length > 0)
	{
		for (var i = 0; i < controlsX.length; i++)
		{
			var control = controlsX[i]
			xText += control.lat.toFixed(0) + "," + control.lon.toFixed(0) + ",";
		}
		xText  = xText.substring(0, xText.length - 1);
	}
	
	url = prefix1 + "pdf"
		+ "/?style=" + mapStyleID 
   		+ "|paper=" + paper 
		+ "|scale=" + scale 
		+ "|centre=" +  sheetCentreLL[1].toFixed(0) + "," + sheetCentreLL[0].toFixed(0)
		+ "|title=" + escapeTitleText
		+ "|club=" + $('#club').val()
		+ "|id=";		
	if (mapID != "new")	
	{
		url += mapID;
	} 
	url	+= "|start=" + startText
		+ "|crosses=" + xText
		+ "|controls=";
		
	if (controls.length > 0)
	{
		for (var i = 0; i < controls.length; i++)
		{
			var control = controls[i]
			url += control.number + "," + control.angle + "," + control.lat.toFixed(0) + "," + control.lon.toFixed(0) + ",";
		}
		url  = url.substring(0, url.length - 1);
	}
	
	if (debug) { console.log(url); }
	self.location=url;	
}

function loadMap(data)
{
	if (debug) { console.log('loadMap'); }
	state = "zoom";

	mapTitle = data.title;
	raceDescription = data.race_instructions;
	var $style = $("#" + data.style);
	var $styleL = $("[for=" + data.style + "]");
	var $scale = $("#" + data.scale);
	var $scaleL = $("[for=" + data.scale + "]");
	var $papersize = $("#" + data.papersize);
	var $papersizeL = $("[for=" + data.papersize + "]");
	var $paperorientation = $("#" + data.paperorientation);
	var $paperorientationL = $("[for=" + data.paperorientation + "]");

	$('#eventdate_alternate').val(data.eventdate);
	$('#eventdate').val(data.eventdate);
	//$('#eventdate').datepicker("refresh");
	//TODO Implement loading of saved club.

	$style.click();
	$styleL.click();
	$scale.click();
	$scaleL.click();
	$papersize.click();
	$papersizeL.click();
	$paperorientation.click();
	$paperorientationL.click(); 

	sheetCentreLL = ol.proj.transform([parseFloat(data.centre_lon), parseFloat(data.centre_lat)], "EPSG:4326", "EPSG:3857");
	olMap.getView().setCenter(sheetCentreLL);
	if (data.scale == "s7500" || data.scale == "s5000" || data.scale == "s4000")
	{
		olMap.getView().setZoom(15);
	}
	else
	{
		olMap.getView().setZoom(14);
	}
	if (debug) { console.log(sheetCentreLL); }
	controlsSF = [];
	controlsX = [];
	controls = [];

	for (var i = 0; i < data.controls.length; i++)
	{
		var control = data.controls[i];
		control.id = topID++;		
		if (!isNaN(parseInt(control.number))) 
		{ 
			control.number = parseInt(control.number); 
			if (control.number > topNumber)
			{
				topNumber = control.number;
			}
		}  			
		control.angle = parseInt(control.angle);	
		control.score = parseInt(control.score);
		var controlLL = ol.proj.transform([parseFloat(control.wgs84lon), parseFloat(control.wgs84lat)], "EPSG:4326", "EPSG:3857"); 
		control.lat = controlLL[1];
		control.lon = controlLL[0];

		if (control.type == "c_startfinish")
		{
			controlsSF.push(control);
		}
		else if (control.type == "c_cross")
		{
			controlsX.push(control);
		}
		else
		{
			controls.push(control);
		}
	}
	mapID = reqMapID;
	rebuildMapControls();
	handleZoom();	
	updateUrl();
}

function rebuildMapSheet()
{
	if (debug) { console.log("rebuildMapSheet"); }

	if (!sheetCentreLL)
	{
		sheetCentreLL = olMap.getView().getCenter();
	}
	
	layerMapBorder.getSource().clear();
	layerMapCentre.getSource().clear();
	layerMapSheet.getSource().clear();
	layerMapTitle.getSource().clear();
	layerMapContent.getSource().clear();

	var papersize = "";
	var paper_pieces = [];

	papersize = $("#papersize :radio:checked").attr("id");

	if ($("#portrait").prop('checked')) {  paper_pieces[0] = 0.0001 * papersize.substring(6); paper_pieces[1] = 0.0001 * papersize.substring(1, 5); }
	else { paper_pieces[0] = 0.0001 * papersize.substring(1, 5); paper_pieces[1] = 0.0001 * papersize.substring(6); }
	paper = paper_pieces[0] + "," + paper_pieces[1];
		
	scale = -1;
	
	scale = $("#mapscale :radio:checked").val();
	scale = parseInt(scale);
		
	var centroidllWGS84 = ol.proj.transform(sheetCentreLL, "EPSG:3857", "EPSG:4326");
	var fudgeFactor = Math.cos(centroidllWGS84[1] * Math.PI/180);
	var trueScale = scale / fudgeFactor;
	//console.log("True scale is " + trueScale);

	var paper_dlon = paper_pieces[0] * trueScale;
	var paper_dlat = paper_pieces[1] * trueScale;

	var map_nm_dlat = 0.014 * trueScale; 
	var map_em_dlon = 0.008 * trueScale; 
	var map_sm_dlat = 0.013 * trueScale;
	var map_wm_dlon = 0.008 * trueScale;

	var map_dlon = (paper_dlon - map_wm_dlon) - map_em_dlon;
	var map_dlat = (paper_dlat - map_nm_dlat) - map_sm_dlat;

	mapBound = [sheetCentreLL[0]-map_dlon/2,  sheetCentreLL[1]-map_dlat/2, sheetCentreLL[0]+map_dlon/2,  sheetCentreLL[1]+map_dlat/2];
	var paperBound = [
	(sheetCentreLL[0] - map_dlon/2) - map_wm_dlon, 			
	( sheetCentreLL[1] - map_dlat/2) - map_sm_dlat, 			
	(sheetCentreLL[0] + map_dlon/2) + map_em_dlon, 			
	( sheetCentreLL[1] + map_dlat/2) + map_nm_dlat];
	var paperWMBound = [	paperBound[0],	mapBound[1], 	mapBound[0],		mapBound[3]];
	var paperEMBound = [	mapBound[2],		mapBound[1], 	paperBound[2],	mapBound[3]];
	var paperNMBound = [	paperBound[0], 	mapBound[3],		paperBound[2], 	paperBound[3]];
	var paperSMBound = [	paperBound[0], 	paperBound[1], 	paperBound[2], 	mapBound[1]];

	var sheet = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(paperBound) });
	
	var titleSizeArr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 5, 9, 18, 36, 72, 144, 288];
	fontSizeFromArr = (titleSizeArr[olMap.getView().getZoom()]*(scale/10000)).toFixed(0);
	mapTitleDisplay = mapTitle.toUpperCase();
	if (country == "blueprint")
	{
		mapTitleDisplay = mapTitle;
	}

	var title = new ol.Feature({ geometry: new ol.geom.Point([ sheetCentreLL[0]-map_dlon/2, sheetCentreLL[1]+map_dlat/2+map_nm_dlat/2]) });
	title.set('fontSizeFromArr',  fontSizeFromArr); 
	title.set('mapTitleDisplay',  mapTitleDisplay);
	title.set('xoff',  0);
	title.set('yoff',  0);
	
	var content = new ol.Feature({ geometry:  ol.geom.Polygon.fromExtent(mapBound) });
	var westMargin = new ol.Feature({ geometry:  ol.geom.Polygon.fromExtent(paperWMBound) });
	var eastMargin = new ol.Feature({ geometry:  ol.geom.Polygon.fromExtent(paperEMBound) });
	var northMargin = new ol.Feature({ geometry:  ol.geom.Polygon.fromExtent(paperNMBound) });
	var southMargin = new ol.Feature({ geometry:  ol.geom.Polygon.fromExtent(paperSMBound) });
	var centreMarker = new ol.Feature({ geometry: new ol.geom.Point(sheetCentreLL) });

	var titleFeature = new ol.Feature({ geometry: new ol.geom.Point([mapBound[0], mapBound[3] + (0.002 * trueScale)])});

	layerMapBorder.getSource().addFeatures([westMargin, eastMargin, northMargin, southMargin, titleFeature]);
	layerMapSheet.getSource().addFeatures([sheet]);
	layerMapTitle.getSource().addFeatures([title]);
	layerMapContent.getSource().addFeatures([content]);
	layerMapCentre.getSource().addFeatures([centreMarker]);
	
	//dragControl.activate();
	rebuildDescriptions();

	$( "#createmap" ).button("enable");
	$( "#deletesheet" ).button("enable");
	$( "#getPostboxes" ).button("enable");	
	$( "#getOpenplaques" ).button("enable");
}

function rebuildMapControls()
{
	layerSF.getSource().clear();
	layerControls.getSource().clear();
	layerX.getSource().clear();
	
	for (var i = 0; i < controlsSF.length; i++)
	{
		var control = controlsSF[i];	
		var controlX = new ol.Feature({geometry: new ol.geom.Point([control.lon, control.lat])});
		layerSF.getSource().addFeatures([controlX]);
	}

	for (var i = 0; i < controlsX.length; i++)
	{
		var control = controlsX[i];	
		var controlX = new ol.Feature({geometry: new ol.geom.Point([control.lon, control.lat])});
		layerX.getSource().addFeatures([controlX]);
	}

	
	for (var i = 0; i < controls.length; i++)
	{
		var control = controls[i];
	
		var controlPoint = new ol.Feature({geometry: new ol.geom.Point([control.lon, control.lat])});
		controlPoint.set('number', "" + control.number); 
		controlPoint.set('xoff', 35 * Math.sin((control.angle*Math.PI)/180));
		controlPoint.set('yoff', -35 * Math.cos((control.angle*Math.PI)/180));

		layerControls.getSource().addFeatures([controlPoint]);		
	}
	
	if (controlsX.length > 0)
	{
		$( "#deleteXs" ).button("enable");
	}
	
	if (controls.length > 0)
	{
		$( "#createclue" ).button("enable");
	}
	else
	{
		$( "#createclue" ).button("disable");		
		$( "#getPostboxes" ).button("enable");	
		$( "#getOpenplaques" ).button("enable");	
	}	
}

function rebuildDescriptions()
{
	$("#controldescriptions tr.controlrow").remove();
	
	controls.sort(function(a, b) 
	{
		if (isNaN(a.number - b.number))
		{
			return a.number < b.number ? -1 : 1;
		}
		return a.number - b.number;
	});
	
	var controlnum = controls.length;
	var maxscore = 0;	

	for (var i = 0; i < controls.length; i++)
	{
		maxscore += controls[i].score;
	}
		
	$("#scalecaption").text('1:' + scale);	
	$("#controlcaption").text('' + controlnum + " control" + (controlnum == 1 ? "" : "s"));	
	$("#pointscaption").text('' + maxscore + " points");	
   
	for (var i = 0; i < controls.length; i++)
	{
		var control  = controls[i];
		$("#controldescriptions").find('tbody')
			.append($('<tr>').addClass('controlrow')
				.append($('<td>')
					.append(control.number)
				  )
				.append($('<td>')
					.append(control.score)
				  )
				.append($('<td>').attr('colspan', '2')
					.append(control.description.length > 28 ? control.description.substring(0,25) + "..."  : control.description)
				  )    
				.append($('<th>')
					.append($('<span>').addClass('edit').attr('id', 'e' + control.id).text('Edit').click(function() { handleControlEditOptions(this.id); })
					  )
					.append($('<span>').addClass('delete').attr('id', 'd' + control.id).text('Delete').click(function() { handleControlDelete(this.id); })
					  )
				  )     			
			);
	}
	
	initDescriptions();
}

/* Search handling */

function handleSearchPostcode()
{
	var pc = $("#postcode").val(); 
	var url = 'postcode.php?pc=' + escape(pc);
    $.get(url, null, handleSearchPostcodeCallback);
	$( "#postcode_searching" ).dialog( "open" );
}

function handleSearchPostcodeCallback(json)
{
	$( "#postcode_searching" ).dialog( "close" );
	var result = JSON.parse(json);
	if (result.success)
	{
		var zoom = olMap.getView().getZoom();
		if (zoom < 13)
		{
			zoom = 13;
		}
		olMap.getView().setCenter(ol.proj.transform([result.easting, result.northing], "EPSG:27700", "EPSG:3857"));
		olMap.getView().setZoom(zoom);
	}	
	else
	{
		$( "#postcode_error" ).dialog( "open" );
		$( "#postcode_error_text" ).html(result.message);
	}
}

function handleGetPostboxes()
{
	var bounds = ol.proj.transformExtent([mapBound[0], mapBound[1], mapBound[2], mapBound[3]], "EPSG:3857", "EPSG:4326");
	//var url = 'http://dracos.co.uk/made/nearest-postbox/nearest.php?bounds=' + mapBound[0] + "%2C" + mapBound[1] + "%2C" + mapBound[2] + "%2C" + mapBound[3];
	var url = 'getpostboxes.php?bounds=' + bounds[0] + "%2C" + bounds[1] + "%2C" + bounds[2] + "%2C" + bounds[3];
    $.get(url, null, handleGetPostboxesCallback);
	$( "#postboxes_searching" ).dialog( "open" );

}

function handleGetPostboxesCallback(result)
{
	var changed = false;
	$( "#postboxes_searching" ).dialog( "close" );
	if (result.length > 0)
	{
		for(var i = 0; i < result.length; i++)
		{
		  	var control = new Object();		  	
		  	control.id = topID++;		  	
		  	control.number = topNumber++;
		  	//TODO Use a different number if one is already being used.		  	
		  	control.angle = 45;
			control.score = 10;
			if (control.number >= 20) { control.score = 20; } 
			if (control.number >= 30) { control.score = 30; } 
			if (control.number >= 40) { control.score = 40; } 
			if (control.number >= 50) {	control.score = 50;	} 
			control.type = "c_regular";
			control.description = "Postbox " + result[i].ref;
			//control.description = "Postbox";
			
			control.lat = ol.proj.transform([result[i].lon, result[i].lat], "EPSG:4326", "EPSG:3857")[1];
			control.lon = ol.proj.transform([result[i].lon, result[i].lat], "EPSG:4326", "EPSG:3857")[0];
				
			control.wgs84lat = result[i].lat; 
			control.wgs84lon = result[i].lon;				
			var dupe = false;
			for (var j = 0; j < controls.length; j++)
			{
				if (controls[j].wgs84lat == control.wgs84lat && controls[j].wgs84lon == control.wgs84lon)
				{
					dupe = true;
				} 
			}
			if (!dupe)
			{
				controls.push(control);
				changed = true;
			}
		}
		$( "#getPostboxes" ).button("disable");	
		rebuildMapControls();
	  	rebuildDescriptions();
	
		if (changed)
		{
			if (mapID != "new")
			{
				mapID = "new";
				updateUrl();
			}
		}
	}	
	else
	{
		$( "#postboxes_error" ).dialog( "open" );
		$( "#postboxes_error_text" ).html(result.message);
	}

}

function handleGetOpenplaques()
{
	var bounds = ol.proj.transformExtent([mapBound[0], mapBound[1], mapBound[2], mapBound[3]], "EPSG:3857", "EPSG:4326");
	var url = '/getopenplaques.php?bounds=[' + bounds[3] + "%2C" + bounds[0] + "]%2C[" + bounds[1] + "%2C" + bounds[2] + "]";
    $.get(url, null, handleGetOpenplaquesCallback);
	$( "#openplaques_searching" ).dialog( "open" );

}

function handleGetOpenplaquesCallback(result)
{
	var changed = false;
	$( "#openplaques_searching" ).dialog( "close" );
	if (result !== undefined && result.features !== undefined && result.features.length > 0)
	{
		for(var i = 0; i < result.features.length; i++)
		{
		  	var control = new Object();		  	
		  	control.id = topID++;		  	
		  	control.number = topNumber++;
		  	//TODO Use a different number if one is already being used.		  	
		  	control.angle = 45;
			control.score = 10;
			if (control.number >= 20) { control.score = 20; } 
			if (control.number >= 30) { control.score = 30; } 
			if (control.number >= 40) { control.score = 40; } 
			if (control.number >= 50) {	control.score = 50;	} 
			control.type = "c_regular";
			control.description = "Plaque: " + result.features[i].properties.inscription;
			//control.description = "Postbox";

			control.lat = ol.proj.transform(result.features[i].geometry.coordinates, "EPSG:4326", "EPSG:3857")[1];
			control.lon = ol.proj.transform(result.features[i].geometry.coordinates, "EPSG:4326", "EPSG:3857")[0];

			control.wgs84lat = result.features[i].geometry.coordinates[1]; 
			control.wgs84lon = result.features[i].geometry.coordinates[0];				

			var dupe = false;
			for (var j = 0; j < controls.length; j++)
			{
				if (controls[j].wgs84lat == control.wgs84lat && controls[j].wgs84lon == control.wgs84lon)
				{
					dupe = true;
				} 
			}
			if (!dupe)
			{
				controls.push(control);
				changed = true;
			}
		}
		$( "#getOpenplaques" ).button("disable");	
		rebuildMapControls();
	  	rebuildDescriptions();
		if (changed)
		{
			if (mapID != "new")
			{
				mapID = "new";
				updateUrl();
			}
		}
	}	
	else
	{
		$( "#openplaques_error" ).dialog( "open" );
		$( "#openplaques_error_text" ).html("There are no plaques in this area recorded on the Open Plaques database, or a system error is preventing retrieval of plaques for this area. Open Plaques has a high number of plaques in the UK, USA and Germany. Check the Open Plaques website at http://openplaques.org/places/");
	}

}

function updateUrl()
{
	if (debug) { console.log('updateUrl'); }
	var centre = ol.proj.transform(olMap.getView().getCenter(), "EPSG:3857", "EPSG:4326");  	
	window.location.hash = "/" + mapID + "/" + mapStyleID + "/" + olMap.getView().getZoom() + "/" + centre[0].toFixed(4) + "/" + centre[1].toFixed(4) + "/"; 

}

$(document).ready(function()
{
	init();
});
