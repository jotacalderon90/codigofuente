app.modules.map = new trascender({
	properties: {
		name: "map", 
		label: "Mapa", 
		icon: "fa-map"
	},
    showApp: function(){
		return true;//(user && user.roles && user.roles.indexOf('user')>-1);
	},
	onload: function() {
		this.map = null;
		this.setLayers();
		this.layer_index = 0;
		this.topojson_coll = [];
		this.service.topojson_total = ["GET", "/api/topojson/total?query=:query"];
		this.service.topojson_collection = ["GET", "/api/topojson/collection?query=:query&options=:options"];
		this.service.topojson_read = ["GET", "/api/topojson/:id"];
		this.createServices();
		this.enPromesa = false;
		this.started = false;
		this.addKeyEvent();
		this.parentCollection = null;
		
		$('body').delegate('.leaflet-popup-content .btn-primary','click',(e)=>{this.mapPopupClick(e)});
	},
	start: function(){
		
	},
	open: function(){
		$("#map_modal_main").modal("show");
		if(!this.started){
			this.started = true;
			this.loadMAP();
			//await this.wait(1000);
			//this.refresh();
		}
	},
	
	baseurl: "api/map",
	loadMAP: function(){
		let lat = -33.59875863395195;
		let lng = -70.7080078125;
        this.map = L.map("default_map_div").setView([lat, lng], 3);
		
		this.changeMap(this.layer_index);
		
		this.marker = [];
		$(".leaflet-control-zoom").css("display", "none");
        $(".leaflet-control-layers").css("display", "none");
		this.currentPosition = null;
		
		if(this.hasRole('root') || this.hasRole('admin')){
			this.createAdminButtons();
		}
	},
    geolocation: async function() {
        try {
			$(".loader").fadeIn();
			
			this.rmMarkers();
			this.currentPosition = await Capacitor.Plugins.Geolocation.getCurrentPosition();
			
			const m = this.currentPositionToMarker(this.currentPosition);
			m.addTo(this.map);
			this.marker.push(m);
			
			this.map.setView([this.currentPosition.coords.latitude, this.currentPosition.coords.longitude], 20);
			
			$("#map_geolocation_collapse").find("code").html(JSON.stringify({lat: this.currentPosition.coords.latitude, lng: this.currentPosition.coords.longitude}));
			$("#map_geolocation_collapse").collapse('show');
        } catch (e) {
            alert("No se pudo acceder a la ubicación del dispositivo");
            console.log(e);
        }
		$(".loader").fadeOut();
    },
	currentPositionToMarker: function(cp){
		return L.marker([cp.coords.latitude, cp.coords.longitude]);
	},
	rmMarkers: function(){
		for(let i=0;i<this.marker.length;i++){
			this.rmMarker(this.marker[i]);
		}
	},
    rmMarker: function(marker) {
		this.map.removeLayer(marker);
    },
	setLayers: function(){
		
		this.layers = [];
		
		//https://leaflet-extras.github.io/leaflet-providers/preview/
		
		this.layers.push({
			label: "satelite nocturno",
			thumb: "/assets/media/img/map/voyagerlabelsunder.png",
			data: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				attribution: ""//'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
			})
		});
		
		this.layers.push({
			label: "satelite",
			thumb: "/assets/media/img/map/arcgisonline.png",
			data: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g")
		});
		
		this.layers.push({
			label: "satelite nocturno",
			thumb: "/assets/media/img/map/earthdata.png",
			data: L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
				attribution: '',//Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 8,
				format: 'jpg',
				time: '',
				tilematrixset: 'GoogleMapsCompatible_Level'
			})
		});
		
		this.layers.push({
			label: "satelite nocturno",
			thumb: "/assets/media/img/map/opentopomap.png",
			data: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
				maxZoom: 17,
				attribution: ""//'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
			})
		});
		
		this.layer_index = null;
		
	},
	changeMap: function(index){
		if(this.layer_index!=null){
			this.map.removeLayer(this.layers[this.layer_index].data);
		}		
		this.layers[index].data.addTo(this.map);	
		this.layer_index = index;
		$("#map_modal_form").modal("hide");
		$("#map_modal_main").modal("show");
	},
	
	refresh: function(){
		if (this.map && this.map.remove) {
			this.map.off();
			this.map.remove();
			this.loadMAP();
		}else{
			this.loadMAP();
		}
	},
	
	setMapAsPromise: function (doc){
		return new Promise((resolve,reject)=>{
			this.open();
			//$('#map_modal_main .modal-footer').fadeOut();
			this.new();
			this.enPromesa = true;
			this.resolve = resolve;
			this.reject = reject;
			if(doc){
				this.loadMarker(doc);
			}
		});		
	},
	loadMarker: async function(doc){
		this.open();
		await this.wait(1000);
		this.refresh();
		const m = L.marker([doc.lat, doc.lng]);
		m.addTo(this.map);
		this.marker.push(m);
		this.map.setView([doc.lat, doc.lng], (doc.zoom || 5)/*, {
			animate: true,
			pan: {
				duration: 1
			}
		}*/);
		
	},
	loadMarkers: async function(coll){
		for(let i=0;i<coll.length;i++){		
			const m = L.marker([coll[i].lat, coll[i].lng]);
			m.addTo(this.map);
			this.marker.push(m);	
		}
	},
	
	/***************************/
	/*LOAD COLLECTION EJM STORY*/
	/***************************/
	
	loadCollection: async function(parent){
		this.open();
		await this.wait(1000);
		this.refresh();
		this.parentCollection = parent;
		this.loadDocFromParent();
		this.parent.refreshView();
	},
	loadDocFromParent: function(){
		this.rmMarkers();
		const doc = this.parent[this.parentCollection].sendDocToMap();
		const m = L.marker([doc.lat, doc.lng]);
		m.addTo(this.map);
		this.marker.push(m);
		this.map.setView([doc.lat, doc.lng], (doc.zoom || 5)/*, {animate: true,pan: {duration: 1}}*/);
		
		if(doc.popup){
			m.bindPopup(doc.popup).openPopup();
		}
		
		if(doc.audio){
			document.getElementById("audio").src = doc.audio;
			document.getElementById("audio").play();
		}
		
		
	},
	showButtons: function(){
		return this.parentCollection==null;
	},
	showLeftArrow: function(){
		return this.parentCollection!=null && this.parent[this.parentCollection].showLeftArrow();
	},
	showRightArrow: function(){
		return this.parentCollection!=null && this.parent[this.parentCollection].showRightArrow();
	},
	leftArrow: function(){
		this.parent[this.parentCollection].leftArrow();
		this.loadDocFromParent();
	},
	rightArrow: function(){
		this.parent[this.parentCollection].rightArrow();
		this.loadDocFromParent();
	},
	
	createAdminButtons: function(){
		try{
			let drawnItems = L.featureGroup().addTo(this.map);
			L.control.layers({}, { 'drawlayer': drawnItems }, { position: 'topleft', collapsed: false }).addTo(this.map);
			this.map.addControl(new L.Control.Draw({
				edit: {
					featureGroup: drawnItems,
					poly: {
						allowIntersection: false
					}
				},
				draw: {
					polygon: {
						allowIntersection: false,
						showArea: true
					}
				}
			}));
			this.map.on(L.Draw.Event.CREATED, (event)=>{this.onDragMarker(event);});
			/*$(".leaflet-control-layers-toggle,"+
			".leaflet-draw-draw-polyline,"+
			".leaflet-draw-draw-polygon,"+
			".leaflet-draw-draw-rectangle,"+
			".leaflet-draw-draw-circle,"+
			//".leaflet-draw-draw-marker,"+
			".leaflet-draw-draw-circlemarker,"+
			".leaflet-draw-edit-edit,"+
			".leaflet-draw-edit-remove").css("display","none");
			
			$(".leaflet-control-zoom").css("display","none");
			$(".leaflet-control-layers").css("display","none");*/
		}catch(e){
			console.log(e);
		}
	},
	onDragMarker: function(event) {
		let layer = event.layer;
		//L.geoJSON(layer.toGeoJSON()).addTo(this.map);
		
        this.getDoc().center = this.map.getCenter();
        this.getDoc().zoom = this.map.getZoom();
        this.getDoc().lng = layer.toGeoJSON().geometry.coordinates[0];
        this.getDoc().lat = layer.toGeoJSON().geometry.coordinates[1];
        this.getDoc().geojson = layer.toGeoJSON();
		
		if(this.enPromesa){
			this.enPromesa = false;
			//$('#map_modal_main .modal-footer').fadeIn();
			$('#map_modal_main').modal('hide');
			this.resolve(this.getDoc());
			return;
		}	
			/*			
			if(this.isCreateMode()){
				this.create();
			}else if(this.isEditMode()){
				this.update();
			}*/
    },
	
	afterCreate: function(s){
		alert('fin ejecución');
		console.log(s);
	},
	afterUpdate: function(s){
		alert('fin ejecución');
		console.log(s);
	},
    
	loadTopojson: async function(){
		try{
			$(".loader").fadeIn();
			const total = await this.service_topojson_total({query: '{}'});
			this.topojson_coll = [];
			while(this.topojson_coll.length < total){
				const c = await this.service_topojson_collection({query: '{}',options: '{"skip": ' + this.topojson_coll.length + ', "limit": 10, "projection": {"name": 1}}'});
				this.topojson_coll = this.topojson_coll.concat(c);
			}
		}catch(e){
			alert(e);
			console.log(e);
		}
		$(".loader").fadeOut();
		this.parent.refreshView();
	},
	loadTopojsonDATA: async function(id,parentData){
		try{
			$(".loader").fadeIn();
			
			L.TopoJSON = L.GeoJSON.extend({
				addData: function (data) {
					var geojson, key;
					if (data.type === "Topology") {
						for (key in data.objects) {
							if (data.objects.hasOwnProperty(key)) {
								geojson = topojson.feature(data, data.objects[key]);
								L.GeoJSON.prototype.addData.call(this, geojson);
							}
						}
						return this;
					}
					L.GeoJSON.prototype.addData.call(this, data);
					
					$("#map_modal_form").modal("hide");
					$("#map_modal_main").modal("show");
					$(".loader").fadeOut();
					
					return this;
				}
			});
			
			L.topoJson = function (data, options) {
				return new L.TopoJSON(data, options);
			};
			
			//create an empty geojson layer
			//with a style and a popup on click
			var geojson = L.topoJson(null, {
				style: function(feature){
					return {
						color: "#000",
						opacity: 1,
						weight: 1,
						fillColor: '#35495d',
						fillOpacity: 0.8
					}
				},
				onEachFeature: function(feature, layer) {
					console.log(feature);
					const i = 'data-selected="' + btoa(JSON.stringify(feature.properties)) + '"';
					const b = '<button class="btn btn-primary" ' + i + '><i class="fa fa-plus"></i></button>';
					layer.bindPopup('<p>' + feature.properties.label + '<br>' + b +'</p>');
				}
			}).addTo(this.map);
			
			if(parentData){
				this.data = parentData;
				geojson.addData(parentData);
			}else{
				const response = await fetch('/api/topojson/' + id);
				this.data = await response.json();
				geojson.addData(this.data.data.data);
			}
			
			/*
			$.getJSON("/assets/media/json/regiones.mini.json", (data)=>{
				console.log(data.objects["chile-regions"]);
				console.log(euCountries);
				L.geoJSON(data.objects["chile-regions"]).addTo(this.map);
			});*/
			
		}catch(e){
			alert(e);
		}
	},
	
	mapPopupClick: async function(e){
		const selected = JSON.parse(atob(e.currentTarget.getAttribute("data-selected")));
		console.log(selected);
		console.log(this.data.data.name);
		console.log(this.data.data.info);
		console.log(this.data.data.data);
		console.log(selected);
		
		$('#map_modal_main').modal('hide');
		const op = await this.parent.promise.selector('Buscar', this.data.data.info, this.open);
		console.log(op);
		$('#map_modal_main').modal('show');
	},
	
	
	/****************/
	/*KEYPRESS EVENT*/
	/****************/
	addKeyEvent: function(){
		/*document.querySelector('#default_map_div').addEventListener('keydown', (evt)=>{
			switch(evt.keyCode){
				case 37://left
					alert('l');
					break;
				case 39://right
					alert('r');
					break;
			}
		});*/
	}
	
});