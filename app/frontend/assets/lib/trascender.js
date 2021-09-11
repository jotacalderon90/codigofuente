const trascender = function(data){
	this.newdoc = null; 
	this.doc = null;
	this.coll = [];
	this.cant = 0;
	this.obtained = 0;
	this.increase = false;
	this.action = null;
	this.totalpages = 0;
	this.rowsByPage = 10;
	this.pages = [];
	this.selectedPage = 0;
	this.headerContentType = "application/json;charset=UTF-8";
	this.log = [];
	this.scrolling = false;
	this.scroller = null;
	this.obtaining = false;
	
	/*touchevent*/
	this.xDown = null;                                                        
	this.yDown = null;
	this.detectSwipe = null;
	
	this.service = {
		total:		["GET", 	data.baseurl + "/total?query=:query"],
		collection: ["GET", 	data.baseurl + "/collection?query=:query&options=:options"],
		tag:		["GET",		data.baseurl + "/tag/collection"],
		create:		["POST",	data.baseurl],
		read:		["GET", 	data.baseurl + "/:id"],
		update:		["PUT",		data.baseurl + "/:id"],
		delete:		["DELETE",	data.baseurl + "/:id"]
	};
	
	this.message = {
		total: {on: "Cargando total de documentos", error: "Error al obtener la cantidad de documentos", success: "Total de documentos cargados"},
		collection: {on: "Cargando documentos", error: "Error al cargar documentos", success: "Documentos cargados correctamente"},
		create: {on: "Creando documento", error: "Error al crear documento", success: "Documento creado correctamente"},
		read: {on: "Cargando documento", error: "Error al cargar documento", success: "Documento cargado correctamente"},
		update: {on: "Actualizando documento", error: "Error al actualizar el documento", success: "Documento actualizado correctamente"},
		delete: {on: "Eliminando documento", error: "Error al eliminar el documento", success: "Documento eliminado correctamente"}
	}
		
	if(data){
		for(attr in data){
			this[attr] = data[attr];
		}
	}
	
	this.query = {};
	this.options = {skip: 0, limit: this.rowsByPage};
	this.filter = {};
	
	this.createServices();
	
	if(this.scrolling){
		$(window).scroll(()=>{
			if(Math.round($(window).scrollTop() + $(window).height()) == Math.round($(document).height())) {
				if(this.obtained < this.cant && !this.obtaining){
					this.getCollection();
				}
			}
		});	
	}
	
	if(this.scroller!==null){
		if(typeof this.scroller === 'string'){		
			$(this.scroller).scroll(()=>{
				const p = $(this.scroller)[0].scrollHeight - $(document).height();
				if(($(this.scroller).scrollTop()*100)/p>=99){
					if(this.obtained < this.cant && !this.obtaining){
						this.getCollection();
					}
				}
			});	
		}else{
			for(let i=0;i<this.scroller.length;i++){				
				$(this.scroller[i]).scroll(()=>{
					const p = $(this.scroller[i])[0].scrollHeight - $(document).height();
					if(($(this.scroller[i]).scrollTop()*100)/p>=99){
						if(this.obtained < this.cant && !this.obtaining){
							this.getCollection();
						}
					}
				});
			}
		}
	}
	
	if(this.onload){
		this.onload();
	}
	
}

trascender.prototype.createServices = function(){
	for(service in this.service){
		this["service_" + service] = this.serviceCreate(this.service[service][0],this.service[service][1]);
	}
}

trascender.prototype.default = function(){
	return {};
}

trascender.prototype.new = function(){
	this.action = "new";
	this.newdoc = this.default();
	this.afterChangeMode("new",this.newdoc);
}

trascender.prototype.select = function(doc){
	this.action = "read";
	this.doc = doc;
	this.afterChangeMode("read",this.doc);
}

trascender.prototype.edit = function(doc){
	if(doc){
		this.doc = doc;
	}
	this.action = "edit";
	this.afterChangeMode("edit",this.doc);
}

trascender.prototype.afterChangeMode = function(action,doc){
	
}
	
trascender.prototype.close = function(){
	this.doc = null;
	this.newdoc = null;
	this.action = null;
}

trascender.prototype.isCreateMode = function(){
	return (this.action=="new")?true:false;
}
	
trascender.prototype.isReadMode = function(){
	return (this.action=="read")?true:false;
}

trascender.prototype.isEditMode = function(){
	return (this.action=="edit")?true:false;
}

trascender.prototype.getDoc = function(){
	if(this.isCreateMode()){
		return this.newdoc;
	}else if(this.isReadMode() || this.isEditMode()){
		return this.doc;
	}else{
		return {};
	}
}
				
trascender.prototype.formatToClient = function(doc){
	return doc;
}
	
trascender.prototype.formatToServer = function(doc){
	return doc;
}

trascender.prototype.formatCollectionToClient = function(coll){
	if(coll!=undefined){
		for(var i=0;i<coll.length;i++){
			coll[i] = this.formatToClient(coll[i]);
		}
		return coll;
	}else{
		return [];
	}
}

trascender.prototype.formatBody = function(doc){
	if(this.headerContentType=="application/json;charset=UTF-8"){
		return JSON.stringify(doc);
	}else{
		var formData = new FormData();
		formData.append("file", doc.file);
		return formData;
	}
}
	
trascender.prototype.addLog = function(msg){
	this.log.push({
		msg: msg,
		show: true, 
		class: "alert-info", 
		spinner: true,
		showError: false,
		xhttp: null
	});
	return this.log[this.log.length-1];
}

/***********/
/*PAGINATOR*/
/***********/
	
trascender.prototype.setPages = function(){
	this.totalpages = Math.ceil(this.cant / this.rowsByPage);
	this.pages = [];
	for(var i=1;i<=this.totalpages;i++){
		this.pages.push(i);
	}
	this.selectedPage = 1;
}
	
trascender.prototype.gotoFirstPage = function(){
	this.obtained = (1*this.rowsByPage) - this.rowsByPage;
	this.getCollection();
	this.selectedPage = 1;
}
	
trascender.prototype.gotoPage = function(page){
	this.obtained = (page*this.rowsByPage) - this.rowsByPage;
	this.getCollection();
	this.selectedPage = page;
}
	
trascender.prototype.gotoLastPage = function(){
	this.obtained = (this.pages[this.pages.length-1]*this.rowsByPage)-this.rowsByPage;
	this.getCollection();
	this.selectedPage = this.pages.length;
}

trascender.prototype.gotoPrev = function(){
	if(this.selectedPage!=1){
		this.gotoPage(this.selectedPage-1);
	}
}
	
trascender.prototype.gotoNext = function(){
	if(this.pages.length>this.selectedPage){
		this.gotoPage(this.selectedPage+1);
	}
}

trascender.prototype.isSelected = function(page){
	return (page==this.selectedPage)?"active":"";
}
	
trascender.prototype.getPages = function(){
	if(this.pages.length <= 10){
		return this.pages;
	}else{
		if(this.selectedPage<=5){
			return this.pages.slice(0,10);
		}else{
			return this.pages.slice(this.selectedPage-5,this.selectedPage-5+10);
		}
	}
}

/**************/
/*REST SERVICE*/
/**************/

trascender.prototype.serviceCreate = function(METHOD,URL){
	if(METHOD == "GET" || METHOD == "DELETE"){
		return function(params){
			return this.execute(METHOD,this.URIBuild(URL,params),undefined,undefined);
		}
	}else if(METHOD == "POST" || METHOD == "PUT"){
		return function(params,body){
			return this.execute(METHOD,this.URIBuild(URL,params),body,this.headerContentType);
		}
	}
}
	
trascender.prototype.URIBuild = function(uri,params){
	for(var attr in params){
		uri = uri.replace(":"+attr,params[attr]);
	}
	return uri;
}
	
trascender.prototype.execute = function(method,url,body,headerContentType){
	return new Promise(function(resolve, reject) {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4) {
				try{
					if(xhttp.status == 200){
						xhttp.json = JSON.parse(xhttp.responseText);
						if(xhttp.json.data!=null){
							resolve(xhttp.json.data);
						}else{
							throw(xhttp.json.error);
						}
					}else if(xhttp.status == 401){
						location.reload();
					}else{
						throw({status: xhttp.status});
					}
				}catch(e){
					reject({
						error: e,
						xhttp: xhttp
					});
				}
			}
		};
		xhttp.open(method,url);
		if(body!=undefined){
			if(headerContentType!=""){
				xhttp.setRequestHeader("Content-Type", headerContentType);
			}
			if(typeof body!="string"){
				body = JSON.stringify(body);
			}
			xhttp.send(body);
		}else{
			xhttp.send();
		}
	});
}

trascender.prototype.wait = function(TIME){
	return new Promise(function(resolve, reject) {
		setTimeout(function(){
			resolve();
		}, TIME);
	});
}

/***********************/
/*REST API TO GET TOTAL*/
/***********************/

trascender.prototype.beforeGetTotal = function(){
	return true;
}
	
trascender.prototype.paramsToGetTotal = function(){
	return {query: JSON.stringify(this.query)};
}

trascender.prototype.getTotal = async function(){
	try{
		if(this.beforeGetTotal()){
			this.totalLog = this.addLog(this.message.total.on);
			this.cant = await this.service_total(this.paramsToGetTotal());
			this.totalLog.msg = this.message.total.success;
			this.totalLog.class = "alert-success";
			this.totalLog.spinner = false;
			this.setPages();
			this.afterGetTotal(true);
		}
	}catch(e){
		console.log(e);
		this.totalLog.xhttp = e.xhttp;
		this.totalLog.msg = this.message.total.error;
		this.totalLog.class = "alert-danger";
		this.totalLog.spinner = false;
		this.afterGetTotal(false, e.xhttp);
	}
}
	
trascender.prototype.afterGetTotal = function(success, xhttp){
	
}

/****************************/
/*REST API TO GET COLLECTION*/
/****************************/
	
trascender.prototype.beforeGetCollection = function(){
	return true;
}
	
trascender.prototype.paramsToGetCollection = function(){
	return {query: JSON.stringify(this.query), options: JSON.stringify(this.options)};
}

trascender.prototype.getCollection = async function(){
	try{
		if(this.beforeGetCollection()){
			this.obtaining = true;
			this.collectionLog = this.addLog(this.message.collection.on);
			this.options.skip = this.obtained;
			let coll = await this.service_collection(this.paramsToGetCollection());
			coll = this.formatCollectionToClient(coll);
			this.obtained += coll.length;
			if(this.increase){
				this.coll = this.coll.concat(coll);
			}else{
				this.coll = coll;
			}
			this.collectionLog.msg = this.message.collection.success;
			this.collectionLog.class = "alert-success";
			this.collectionLog.spinner = false;
			this.obtaining = false;
			this.afterGetCollection(true);	
		}
	}catch(e){
		console.log(e);
		this.collectionLog.xhttp = e.xhttp;
		this.collectionLog.msg = this.message.collection.error;
		this.collectionLog.class = "alert-danger";
		this.collectionLog.spinner = false;
		this.afterGetCollection(false, e.xhttp);
	}	
}
	
trascender.prototype.afterGetCollection = function(success, xhttp){
	
}

trascender.prototype.getAll = async function(){
	try{
		while(this.obtained < this.cant){
			await this.getCollection();
		}
	}catch(e){
		console.log(e);
	}	
}



/**********************/
/*REST API TO GET TAGS*/
/**********************/
	
trascender.prototype.beforeGetTag = function(){
	return true;
}

trascender.prototype.getTag = async function(){
	try{
		if(this.beforeGetTag()){
			this.tag = await this.service_tag();
			this.tag.sort();
			this.afterGetTag(true);	
		}
	}catch(e){
		console.log(e);
		this.afterGetTag(false, e.xhttp);
	}	
}
	
trascender.prototype.afterGetTag = function(success, xhttp){
	
}

/********************/
/*REST API TO CREATE*/
/********************/
	
trascender.prototype.beforeCreate = function(doc){
	return true;
}

trascender.prototype.paramsToCreate = function(){
	return {};
}

trascender.prototype.create = async function(){
	try{
		this.newdoc = this.formatToServer(this.newdoc);
		if(this.beforeCreate(this.newdoc)){
			this.createLog = this.addLog(this.message.create.on);
			await this.service_create(this.paramsToCreate(),this.formatBody(this.newdoc));
			if(this.createLog){
				this.createLog.msg = this.message.create.success;
				this.createLog.class = "alert-success";
				this.createLog.spinner = false;			
			}
			this.close();
			this.afterCreate(true);	
		}
	}catch(e){
		console.log(e);
		if(this.createLog){
			this.createLog.xhttp = e.xhttp;
			this.createLog.msg = this.message.create.error;
			this.createLog.class = "alert-danger";
			this.createLog.spinner = false;			
		}
		this.afterCreate(false, e.xhttp);
	}
}
	
trascender.prototype.afterCreate = function(success, xhttp){
	
}

/******************/
/*REST API TO READ*/
/******************/
	
trascender.prototype.beforeRead = function(){
	return true;
}

trascender.prototype.read = async function(query){
	try{			
		if(this.beforeRead()){
			let q = {id: query};
			if(typeof query!="string"){
				q = 	query;
			}
			this.readLog = this.addLog(this.message.read.on);
			this.doc = await this.service_read(q);
			this.doc = this.formatToClient(this.doc);
			this.readLog.msg = this.message.read.success;
			this.readLog.class = "alert-success";
			this.readLog.spinner = false;
			this.action = "read";
			this.afterRead(true);	
		}
	}catch(e){
		console.log(e);
		this.readLog.xhttp = e.xhttp;
		this.readLog.msg = this.message.read.error;
		this.readLog.class = "alert-danger";
		this.readLog.spinner = false;
		this.afterRead(false, e.xhttp);
	}
}

trascender.prototype.afterRead = function(success, xhttp){
	
}

/********************/
/*REST API TO UPDATE*/
/********************/

trascender.prototype.beforeUpdate = function(doc){
	return true;
}

trascender.prototype.paramsToUpdate = function(){
	return {id: this.doc._id};
}

trascender.prototype.update = async function(){
	try{
		this.doc = this.formatToServer(this.doc);
		if(this.beforeUpdate(this.doc)){
			this.updateLog = this.addLog(this.message.update.on);
			await this.service_update(this.paramsToUpdate(),this.formatBody(this.doc));
			this.updateLog.msg = this.message.update.success;
			this.updateLog.class = "alert-success";
			this.updateLog.spinner = false;
			this.close();
			this.afterUpdate(true);	
		}
	}catch(e){
		console.log(e);
		this.updateLog.xhttp = e.xhttp;
		this.updateLog.msg = this.message.update.error;
		this.updateLog.class = "alert-danger";
		this.updateLog.spinner = false;
		this.afterUpdate(false, e.xhttp);
	}
}
	
trascender.prototype.afterUpdate = function(success, xhttp){
	
}

/********************/
/*REST API TO DELETE*/
/********************/
	
trascender.prototype.beforeDelete = function(id){
	return true;
}

trascender.prototype.paramsToDelete = function(id){
	return {id: ((id)?id:this.doc._id)};
}

trascender.prototype.delete = async function(id){
	try{			
		if(this.beforeDelete(id)){
			this.deleteLog = this.addLog(this.message.delete.on);
			await this.service_delete(this.paramsToDelete(id));
			this.deleteLog.msg = this.message.delete.success;
			this.deleteLog.class = "alert-success";
			this.deleteLog.spinner = false;
			this.afterDelete(true);	
		}
	}catch(e){
		console.log(e);
		this.deleteLog.xhttp = e.xhttp;
		this.deleteLog.msg = this.message.delete.error;
		this.deleteLog.class = "alert-danger";
		this.deleteLog.spinner = false;
		this.afterDelete(false, e.xhttp);
	}
}

trascender.prototype.afterDelete = function(success, xhttp){
	
}

//SORT OBJECT ASC BY FILD
trascender.prototype.SOABF = function(coll,field){
	return coll.sort(function (a, b) {
		if (a[field] > b[field]) {
			return 1;
		}
		if (a[field] < b[field]) {
			return -1;
		}
		return 0;
	});
}

//GENERIC
trascender.prototype.cleaner = function(cadena){
	var specialChars = "!@#$^&%*()+=-[]\/{}|:<>?,.`";
	for (var i = 0; i < specialChars.length; i++) {
		cadena= cadena.replace(new RegExp("\\" + specialChars[i], 'gi'), '');
	}
	cadena = cadena.toLowerCase();
	cadena = cadena.replace(/ /g,"-");
	cadena = cadena.replace(/á/gi,"a");
	cadena = cadena.replace(/é/gi,"e");
	cadena = cadena.replace(/í/gi,"i");
	cadena = cadena.replace(/ó/gi,"o");
	cadena = cadena.replace(/ú/gi,"u");
	cadena = cadena.replace(/ñ/gi,"n");
	return cadena;
}

trascender.prototype.randomArray = function(array){
	let new_array = [];
	let used = [];
	for(let i=0;i<array.length;i++){
		let r = Math.round(Math.random() * (array.length-1));
		while(used.indexOf(r)>-1){
			r = Math.round(Math.random() * (array.length-1));
		}
		used.push(r);
		new_array.push(array[r]);
	}
	return new_array;
}

trascender.prototype.distinct = function(array){
	let a = [];
	for(let i=0;i<array.length;i++){
		if(a.indexOf(array[i])==-1){
			a.push(array[i]);
		}
	}
	return a;
}

trascender.prototype.updateCart = function(row){
	if(row==undefined){
		row = _document;
	}
	var newp = row._id + "##" + row.title + "##" + row.price + "##" + 1 + "##" + row.dcto + "##" + row.img;
	var cart = localStorage.getItem("cart");
	if(cart==null || cart.trim()==""){
		cart = newp;
	}else{
		cart = atob(cart) + "||" + newp;
	}
	localStorage.setItem("cart",btoa(cart));
	window.location.href="/ecommerce/carro-de-solicitud";
}

trascender.prototype.getLS = function(key,def){
	return localStorage.getItem(key)||def;
}

trascender.prototype.showApp = function(){
	return true;
}



trascender.prototype.getTouches = function(evt){
	return evt.touches || // browser API
	evt.originalEvent.touches; // jQuery
},       
trascender.prototype.handleTouchStart = function(evt) {
	const firstTouch = this.getTouches(evt)[0];                                      
	this.xDown = firstTouch.clientX;                                      
	this.yDown = firstTouch.clientY;                                      
},                                              
trascender.prototype.handleTouchMove = function(evt) {
	if ( ! this.xDown || ! this.yDown ) {
		return;
	}
	var xUp = evt.touches[0].clientX;                                    
	var yUp = evt.touches[0].clientY;
	var xDiff = this.xDown - xUp;
	var yDiff = this.yDown - yUp;
	if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
		if ( xDiff > 0 ) {
			this.detectSwipe = 'left';
		} else {
			this.detectSwipe = 'right';
		}                       
	} else {
		if ( yDiff > 0 ) {
			this.detectSwipe = 'up';
		} else { 
			this.detectSwipe = 'down';
		}                                                                 
	}
	/* reset values */
	this.xDown = null;
	this.yDown = null;                             
}

trascender.prototype.showApp = function(){
	return true;
}
trascender.prototype.putLS = function(key,value){
	localStorage.setItem("app" + "." + this.properties.name + "." + key,value);
}
trascender.prototype.getLS = function(key,def){
	return localStorage.getItem("app" + "." + this.properties.name + "." + key)||def;
}
trascender.prototype.isEmail = function(email){
	if(email!=undefined && email.trim()!="" && /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)){
		return true;
	}else{
		return false;
	}
}
trascender.prototype.isIp = function(ip){
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)){
		return true;
	}
	return false;
}

trascender.prototype.copy = function(id_elemento,content) {
	let aux = document.createElement("input");
	let val = '';
	if(id_elemento!=null){
		val = document.getElementById(id_elemento).innerHTML;
	}else{
		val = content;
	}
	
	val = val.split("\n").join("");
	console.log(val);
	aux.setAttribute("value", val);
	document.body.appendChild(aux);
	aux.select();
	console.log(aux);
	document.execCommand("copy");
	//alert(aux.value + ' copiado al portapapeles');
	document.body.removeChild(aux);
}
trascender.prototype.copyURL = function(uri){
	this.copy(null,host + uri);
}
trascender.prototype.getURI = function(uri){
	return host + uri;
}
trascender.prototype.hasRole = function(role){
	return (user && user.roles && user.roles.indexOf(role)>-1)?true:false;
}