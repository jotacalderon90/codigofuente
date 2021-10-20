app.modules.story = new trascender({
	properties: {
		name: "story", 
		label: "Historia", 
		icon: "fa-file-text"
	},
	showApp: function(){
		return true;
	},
	baseurl: "api/story",
	scroller: ['#story_modal_list .modal-content','#story_modal_tag .modal-content'],
	projection: {uri: 1,thumb: 1,resume: 1,title: 1,created: 1, img: 1, year: 1, month: 1, day: 1, tag: 1, tag_main: 1, map: 1, audio: 1},
	date: new Date(),
	months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
	sorted: {year: 1, month: 1, day: 1, title: 1},
	onload: function(){
		this.started = false;
		this.service_get_setting = this.serviceCreate("GET","/api/" + this.properties.name + "/admin/setting");
		this.service_put_setting = this.serviceCreate("PUT","/api/" + this.properties.name + "/admin/setting");
		CKEDITOR.replace("" + this.properties.name + "_input_content");
		$("body").delegate("#" + this.properties.name + " a","click",(event)=>{this.hrefInSite(event);});
		this.addTouchEvent();
		this.title = this.properties.label;
		this.fulltext = '';
	},
	open: async function(){
		if(!this.started){
			$(".loader").fadeIn();
			await this.firstOpen();
			$(".loader").fadeOut();
		}
		$("#" + this.properties.name + "_modal_tag").modal("show");
	},
	start: function(){
		this.editHTML = new editHTML('/app/' + this.properties.name + '/about.html',this.properties.name + '_modal_about',this.parent);
	},
	firstOpen: async function(){
		await this.get_setting();
		this.set_setting();
		this.refreshAutocomplete();
		this.started = true;
		this.parent.refreshView();
	},
	
	/**************/
	/*MOBILE TOUCH*/
	/**************/
	
	addTouchEvent: function(){
		
		document.querySelector('#' + this.properties.name + '_modal_list .modal-body').addEventListener('touchstart', (evt)=>{this.handleTouchStart(evt)});
		document.querySelector('#' + this.properties.name + '_modal_list .modal-body').addEventListener('touchmove', (evt)=>{this.handleTouchMove(evt)});
		document.querySelector('#' + this.properties.name + '_modal_list .modal-body').addEventListener('touchend', ()=>{this.handleDetect_list()});
		
		document.querySelector('#' + this.properties.name + '_modal_document .modal-body').addEventListener('touchstart', (evt)=>{this.handleTouchStart(evt)});
		document.querySelector('#' + this.properties.name + '_modal_document .modal-body').addEventListener('touchmove', (evt)=>{this.handleTouchMove(evt)});
		document.querySelector('#' + this.properties.name + '_modal_document .modal-body').addEventListener('touchend', ()=>{this.handleDetect_document()});
	},  
	handleDetect_list: function(){
		switch(this.detectSwipe){
			case 'left':
				if(this.index<this.coll.length-1){
					this.index++;
					this.refreshRow();
					if(this.index==this.coll.length-1){
						this.getCollection();
					}
				}
			break;
			case 'right':
				if(this.index>0){
					this.index--;
					this.refreshRow();
				}
			break;
			case 'up':
				this.read(this.coll[this.index]._id);
			break;
		}
		this.detectSwipe = null;
	},
	handleDetect_document: function(){
		switch(this.detectSwipe){
			case 'right':
				$("#" + this.properties.name + "_modal_document").modal("hide");
				$("#" + this.properties.name + "_modal_list").modal("show");
			break;
			case 'left':
				$("#" + this.properties.name + "_modal_document").modal("hide");
				$("#" + this.properties.name + "_modal_list").modal("show");
			break;
		}
		this.detectSwipe = null;
	},
	refreshRow: function(){
		$(".loader").fadeIn(()=>{
			this.row = this.coll[this.index];
			this.parent.refreshView();
			$(".loader").fadeOut();
		});
	},
	
	/*********/
	/*SETTING*/
	/*********/
	
	get_setting: async function(){
		try{
			this.setting = await this.service_get_setting();
			this.setting_string = JSON.stringify(this.setting, undefined, "\t");
		}catch(e){
			alert(e);
		}
	},
	put_setting: async function(){
		try{
			$(".loader").fadeIn();
			if(confirm('confirme')){
				const j = JSON.parse(this.setting_string);
				const r = await this.service_put_setting({},this.formatBody(j));
				await this.get_setting();
				this.set_setting();
				this.refreshAutocomplete();
			}
		}catch(e){
			alert(e.error || e.toString);
			console.log(e);
		}
		$(".loader").fadeOut();
	},
	
	set_setting: function(){
	   
		this.tagbk = [];
		if(this.setting.active && this.setting.tag){//desplegar tags como carpetas
			this.setConceptual(this.setting.tag, 1);
			this.tagAsFolder(this.setting.tag,null);
		}else{
			this.getTag();
		}
	  
	},
	tagAsFolder: function(tags,label){
		if(label){
			this.getByTag(label);
		}
		if(tags===undefined){
			this.parent.pushStory('#' + this.properties.name + '_modal_tag');
			$('#' + this.properties.name + '_modal_tag').modal('hide');
			$('#' + this.properties.name + '_modal_list').modal('show');
			return;
		}
		this.tag = [];
		for(let i=0;i<tags.length;i++){
			if(typeof tags[i]=='string'){
				this.tag.push({label: tags[i]});
			}else if(!tags[i].roles){
				this.tag.push(tags[i]);
			}else if(tags[i].roles && user.roles && user.roles.filter((r)=>{return tags[i].roles.indexOf(r)>-1}).length > 0){
				this.tag.push(tags[i]);
			}
		}
		this.tagbk.push(this.tag);
	},
	tagClose: function(){
		if(!this.setting.active){
			$('#' + this.properties.name + '_modal_tag').modal('hide');
			this.parent.close();
			return;
		}
		if(this.tagbk.length==1){
			$('#' + this.properties.name + '_modal_tag').modal('hide');
			this.parent.close();
		}else{
			this.tagbk.pop();
			this.tag = this.tagbk[this.tagbk.length-1];
			if(this.tagbk.length > 1){
				this.getByTag(this.tag[0].label);
			}else{
				this.clean();
			}
		}
	},
	
	refreshAutocomplete: function(){
		console.log(this.setting.roles_tag.root);
		$("#" + this.properties.name + "_input_tag").autocomplete({source: this.setting.roles_tag.root ||this.tag, select: ( event, ui )=>{
			this.getDoc().tagbk = ui.item.value;
		}});
	},
	
	/************/
	/*TRASCENDER*/
	/************/
	
	increase: true,
	rowsByPage: 6,
	afterChangeMode: function(action,doc){
		switch(action){
			case 'read':
				CKEDITOR.instances[this.properties.name + "_input_content"].setData(this.doc.content);
				CKEDITOR.instances[this.properties.name + "_input_content"].setReadOnly(true);
			break;
			case 'edit':
				CKEDITOR.instances[this.properties.name + "_input_content"].setData(this.doc.content);
				CKEDITOR.instances[this.properties.name + "_input_content"].setReadOnly(false);
			break;
			case 'new':
				CKEDITOR.instances[this.properties.name + "_input_content"].setData("");
				CKEDITOR.instances[this.properties.name + "_input_content"].setReadOnly(false);
			break;
		}
	},
	
	/*****/
	/*GET*/
	/*****/
	
	clean: function(){
		this.coll = [];
		this.obtained = 0;
		this.index = 0;
	},
	restart: function(){
		if(this.fulltext.trim()!=""){
			this.query["$text"] = {"$search": this.fulltext};
			this.title = this.fulltext;
		}else{
			this.title = this.properties.label;
			delete this.query["$text"];
		}
		this.options.sort = this.sorted;
		this.options.projection = this.projection;
		this.clean();
		$(".loader").fadeIn();
		this.getTotal();
	},
	getByToday: async function(){
		this.fulltext = '';
		this.title = moment(this.date).format("dddd, DD MMMM YYYY");
		this.query = {day: this.date.getDate(),month: this.date.getMonth() + 1};
		$('#story_modal_list .modal-content').animate({scrollTop: 0}, 1000);
		this.restart();
	},
	
	getTag: async function(){
		try{
			this.tag = await this.service_tag();
			this.tag = this.tag.map((r)=>{return {label: r}});
			this.refreshAutocomplete();
			this.parent.refreshView();
		}catch(e){
			alert(e);
			console.log(e);
		}
	},
	afterGetTotal: function(){
		this.getCollection();
	},
	afterGetCollection: function(){
		this.parent.refreshView();
		$(".loader").fadeOut();
	},
	afterRead: function(){
		$("#" + this.properties.name + "_document_content").html(this.doc.content);
		this.getRelations();
		this.select(this.doc);
	},
	getByTag: function(tag,scrollto){
		this.fulltext = '';
		this.query = {};
		if(tag!=""){
			this.title = tag;
			this.query.tag = tag;
		}else{
			this.title = this.properties.label;
			delete this.query.tag;
		}
		
		//document.ti
			//uri += '/categoria/' + tag;
		//let uri = '/' + this.properties.name + '';tle = this.title;
		//window.history.pushState({"html":document.innerHTML,"pageTitle":this.title},this.title, uri);
		
		if(scrollto===1){
			$('#' + this.properties.name + '_modal_list .modal-content').animate({scrollTop: 0}, 1000);
		}
		
		this.restart();
	},
	getRelations: async function(){
		try{
			const query = {tag: {$in: [this.doc.tag_main]}, title: {$ne: this.doc.title}};
			const options = {skip: 0, limit: 10, sort: {created: -1}, projection: this.projection};
			this.doc.relation = await this.service_collection({query: JSON.stringify(query), options: JSON.stringify(options)});
			this.doc.relation = this.randomArray(this.doc.relation).slice(0,2);
			this.doc.relation = this.doc.relation.map((r)=>{return this.formatToClient(r)});
		}catch(e){
			alert(e);
		}
		$(".loader").fadeOut();	
		this.parent.refreshView();
		$('#' + this.properties.name + '_modal_document .modal-content').animate({scrollTop: 0}, 1000);
	},
	search: async function(){
		try{
			this.query = {};
			this.fulltext = await this.parent.promise.prompt('Buscar', 'text', 'Ingrese criterio de búsqueda...','');
			if(this.fulltext.trim()==''){
				$('#' + this.properties.name + '_modal_tag').modal('show');
			}else{				
				this.parent.pushStory('#' + this.properties.name + '_modal_tag');
				$('#' + this.properties.name + '_modal_list').modal('show');
				this.restart();	
			}
		}catch(e){
			alert(e);
		}
	},
	sort: function(){
		for(attr in this.sorted){
			this.sorted[attr] = this.sorted[attr] * -1;
		}
		this.restart();
	},
	
	/***********************/
	/*ARROW IN LIST AND MAP*/
	/***********************/
	
	showLeftArrow: function(){
		return this.index!=0;
	},
	showRightArrow: function(){
		return this.index < this.coll.length - 1;
	},
	leftArrow: function(){
		this.detectSwipe='right';
		this.handleDetect_list();
	},
	rightArrow: function(){
		this.detectSwipe='left';
		this.handleDetect_list();
	},
	
	/**************/
	/*GET BY TITLE*/
	/**************/
	
	hrefInSite: function(event){
		if(event.target.hasAttribute("href") && event.target.getAttribute("href").indexOf("/" + this.properties.name + "/")===0){
			event.preventDefault();
			let data;
			data = event.target.getAttribute("href").split("/");
			data = data[data.length-1];
			this.getDocByTitle(data);
		}
	},
	getDocByTitle: async function(uri){
		try{
			$(".loader").fadeIn();
			let c = await this.service_collection({query: JSON.stringify({uri: uri}), options: JSON.stringify({limit: 1})});
			if(c.length!==1){
				throw("No se encontró el documento con URL " + uri);
			}
			this.openRow(c[0]);
		}catch(e){
			alert(e);
			$(".loader").fadeOut();	
		}
	},
	
	/*************/
	/*FROM SERVER*/
	/*************/
	
	newByServer: async function(){
		await this.firstOpen();
		this.new();
		this.parent.refreshView();
		$("#" + this.properties.name + "_modal_form").modal("show");
	},
	getByTag2: async function(data){
		await this.firstOpen();
		this.getByTag(data);
		const urlParams = new URLSearchParams(window.location.search);
		if(urlParams.get('map')=='1'){
			this.showCollectionInMap();
		}else{
			$('#' + this.properties.name + '_modal_list').modal('show');
		}
	},
	openRow: async function(row){
		await this.firstOpen();
		this.read(row._id);
		//this.select(this.formatToClient(row));
		//this.parent.refreshView();
		$("#" + this.properties.name + "_modal_document").modal("show");
	},
	editByServer: async function(row){
		await this.firstOpen();
		this.edit(this.formatToClient(row));
		this.parent.refreshView();
		$("#" + this.properties.name + "_modal_form").modal("show");
	},
	getByTodayFS: async function(){
		this.getByToday();
		await this.wait(500);
		this.showCollectionInMap();
	},
	
	/********/
	/*FORMAT*/
	/********/
	
	formatToClient: function(row){
		//row.datefromnow = moment(new Date(row.created), "YYYYMMDD, h:mm:ss").fromNow();
		//row.datetitle = moment(new Date(row.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
		if(row.year<0){
			row.datefromnow = row.year.toString().replace("-","") + " (ac)";
			row.datetitle = row.fecha;
		}else{
			if(isNaN(row.month) || row.month==0){
				row.datefromnow = moment([row.year,1,1], "YYYYMMDD").fromNow();
				row.datetitle = "Alrededor del año " + row.year;
			}else{
				row.mes = row.month;
				if(isNaN(row.day) || row.day==0){
					row.datefromnow = moment([row.year,row.mes,1], "YYYYMMDD").fromNow();
					row.datetitle = this.months[row.month-1] + " del año " + row.year;
				}else{
					row.dia = row.day;
					row.datefromnow = moment([row.year,row.mes,row.dia], "YYYYMMDD").fromNow();
					row.datetitle = moment([row.year,row.mes-1,row.dia]).format("dddd, DD MMMM YYYY");
				}
			}
		}
		if(row.year>=1940 && row.year<1950){
			row.epoch = "década del 40'";
		}else if(row.year>=1950 && row.year<1960){
			row.epoch = "década del 50'";
		}else if(row.year>=1960 && row.year<1970){
			row.epoch = "década del 60'";
		}else if(row.year>=1970 && row.year<1980){
			row.epoch = "década del 70'";
		}else if(row.year>=1980 && row.year<1990){
			row.epoch = "década del 80'";
		}else if(row.year>=1990 && row.year<=2000){
			row.epoch = "década del 90'";
		}else{
			row.epoch = this.centuryFromYear(row.year);
		}
		//row.uri = '/story/' + row.title;
		return row;
	},
	romanize: function(num) {
		if (!+num)
			return false;
		var digits = String(+num).split(""),
			key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
				   "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
				   "","I","II","III","IV","V","VI","VII","VIII","IX"],
			roman = "",
			i = 3;
		while (i--)
			roman = (key[+digits.pop() + (i * 10)] || "") + roman;
		return Array(+digits.join("") + 1).join("M") + roman;
	},
	centuryFromYear: function(year){
		let r = null;
		if( isNaN(Number(year)) ){
			r = undefined;
		}else{
			r = Math.floor((year-1)/100) + 1;
			if(r<0){
				r = "Siglo " + this.romanize((r*-1)) + " (AC)";
			}else{
				r = "Siglo" + this.romanize(r);
			}
		}
		return r;
	},
	formatToServer: function(doc){
		delete doc.datefromnow;
		delete doc.datetitle;
		delete doc.tagbk;
		delete doc.fontbk;
		delete doc.relation;
		doc.content = CKEDITOR.instances["" + this.properties.name + "_input_content"].getData();
		return doc;
	},
	
	/**************/
	/*CUD WORKFLOW*/
	/**************/
	
	beforeCUD: function(title){
		if(!confirm("Confirme " + title)){
			return;
		}
		$("#" + this.properties.name + "_modal_form").modal("hide");
		$(".loader").fadeIn();
		return true;
	},
	beforeCreate: function(){
		return this.beforeCUD('creación');
	},
	beforeUpdate: function(){
		return this.beforeCUD('actualización');
	},
	beforeDelete: function(){
		return this.beforeCUD('eliminación');
	},
	afterCUD: async function(s,r){
		$(".loader").fadeOut();	
		if(!s){
			await this.parent.promise.message('ERROR', r.json.error);
		}
		this.restart();
		$("#" + this.properties.name + "_modal_tag").modal("show");
	},
	afterCreate: function(s,r){
		this.afterCUD(s,r);
	},
	afterUpdate: function(s,r){
		this.afterCUD(s,r);
	},
	afterDelete: function(s,r){
		this.afterCUD(s,r);
	},
	
	/*******************/
	/*ON CREATE OR EDIT*/
	/*******************/
	
	default: function(){
		return {title: '', tag: [],font:[], year: this.date.getFullYear(), month: this.date.getMonth() +1, day: this.date.getDate()};
	},
	getPostFileUpload: function(URL) {
        return "/api/" + this.properties.name + "/" + ((this.doc)?this.doc._id:"") + "/image";
    },	
	titleOnBlur: function(){
		if(this.action=="new"){
			this.newdoc.uri = this.cleaner(this.newdoc.title);
		}else{
			this.doc.uri = this.cleaner(this.doc.title);
		}
	},
	addTag: function(event){
		if(event.which === 13) {
			if(this.getDoc().tag.indexOf(this.getDoc().tagbk)==-1){
				this.getDoc().tag.push(this.getDoc().tagbk);
				this.getDoc().tagbk = "";
			}
		}
	},
	removeTag: function(i){
		this.getDoc().tag.splice(i,1);
	},
	addFont: function(event){
		if(event.which === 13) {
			if(this.getDoc().font.indexOf(this.getDoc().fontbk)==-1){
				this.getDoc().font.push(this.getDoc().fontbk);
				this.getDoc().fontbk = "";
			}
		}
	},
	removeFont: function(i){
		this.getDoc().font.splice(i,1);
	},
	
	setMap: async function(){
		this.getDoc().map = await this.parent.map.setMapAsPromise(this.getDoc().map);
		$('#story_modal_form').modal('show');
		this.parent.refreshView();
	},
	
	loadMap: async function(){
		this.parent.pushStory('#story_modal_document');
		this.parent.map.loadMarker(this.doc.map);
	},
	showCollectionInMap: function(){
		this.parent.pushStory('#story_modal_list');
		//this.parent.pushStory('#story_modal_document');
		this.parent.map.layer_index = 1;
		this.parent.map.loadCollection('story');
	},
	sendDocToMap: function(){
		$(".loader").fadeIn();
		this.row = this.coll[this.index];
		const r = this.row;
		console.log(this.index,this.coll,r);
		$(".loader").fadeOut();
		//this.parent.refreshView();
		return {
			...r.map,
			audio: r.audio,
			popup: '<img width="50%" style="float:left;margin-right: 10px;" src="' + r.img + '"/><b>' + r.title + '</b><br />' + r.datetitle + ", " + r.datefromnow + '.<br />' + r.resume + '<br />'
		};
	},
		
	/*****/
	/*CAN*/
	canComment: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole('user');
	},
	showFooter: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole(this.properties.name);
	},
	canCreate: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole(this.properties.name);
	},
	canEdit: function(){
		return this.hasRole('root') || this.hasRole('admin') || (this.doc!=null && this.hasRole(this.properties.name) && this.doc.author == user._id);
	},
	canSetting: function(){
		return this.hasRole('root');
	},
	
	/************/
	/*CONCEPTUAL*/
	/************/
	
	setConceptual: function(tags,tab){
		if(tab==1){
			this.conceptual = 'Mapa conceptual\n';
		}
		for(let i=0;i<tags.length;i++){
			for(let t=0;t<tab;t++){
				this.conceptual += '\t';
			}
			if(typeof tags[i]=='string'){
				this.conceptual += tags[i] + '\n';
			}else{
				this.conceptual += tags[i].label + '\n';
				if(tags[i].tag){
					this.setConceptual(tags[i].tag,tab + 1)
				}
			}
		}
	},
	gotoConceptual: function(){
		this.parent.pushStory('#' + this.properties.name + '_modal_tag');
		this.parent.conceptual.textarea = this.conceptual;
		this.parent.conceptual.convert(this.properties.name);
	},
	onConceptualSelect: function(tag){
		const c = this.coll.filter((r) => {return r.title === tag});
		if(c.length == 0){
			$("#" + this.properties.name + "_modal_list").modal("show");
			this.getByTag(tag);
		}else{
			$("#" + this.properties.name + "_modal_document").modal("show");
			this.read(c[0]._id);
		}
	},
	refreshConceptual: function(){
		let coll = [];
		for(let i=0;i<=this.index;i++){
			coll.push(this.coll[i]);
		}
		let tags = [];
		let key = 0;

		let inserted = function(tag, parent) {
			let i = tags.filter((r) => {
				let b = false;
				if (r.name == tag) {
					if (parent != null) {
						if (r.parent == getParentId(parent)) {
							b = true;
						}
					} else {
						b = true;
					}
				}
				return b;
			}).length;
			if (i == 0) {
				return false;
			} else {
				return true;
			}
		}

		let getParentId = function(tag) {
			for (let i = tags.length - 1; i >= 0; i--) {
				if (tags[i].name == tag) {
					return tags[i].key;
				}
			}
		}

		let lastWhitKey = function(parent) {
			for (let i = tags.length - 1; i >= 0; i--) {
				if (tags[i].parent == parent && !tags[i].istag) {
					return i;
				}
			}
			return -1;
		}

		let keybk = key;

		let contKEYS = 0;

		for (let i = 0; i < coll.length; i++) {
			let newkey = false;
			let twoif = false;
			for (let x = 0; x < coll[i].tag.length; x++) {
				if (!inserted(coll[i].tag[x], null)) {
					contKEYS++;
					twoif = true;
				}
				if (!inserted(coll[i].tag[x], ((x != 0) ? coll[i].tag[x - 1] : null))) {
					let tag = {};
					tag.istag = true;
					tag.key = key;
					tag.name = coll[i].tag[x];
					if (x > 0) {
						tag.parent = getParentId(coll[i].tag[x - 1]);
					}
					tags.push(tag);
					keybk = key;
					newkey = true;
					key++;
					twoif = true;
				}
			}
			let l = lastWhitKey(getParentId(coll[i].tag_main));
			if (l == -1) {
				tags.push({
					key: key,
					name: coll[i].title,
					parent: keybk,
					isChild: true
				});
				key++;
			} else {
				tags[l].name += "\n" + coll[i].title;
			}
		}
		this.parent.conceptual.initGO(tags,'story');
		/*
		if (true) { //toMAP
			let c = tags.filter((r) => {
				return r.isChild
			});
			//set cantParent
			//set maxParent
			let maxParent = 0;
			for (let i = 0; i < c.length; i++) {
				let keyParent = c[i].parent;
				let findParent = true;
				let contParent = 0;

				while (findParent) {
					let p = tags.filter((r) => {
						return r.istag && r.key == keyParent
					})[0];
					contParent++;
					if (!isNaN(p.parent)) {
						keyParent = p.parent;
					} else {
						findParent = false;
					}
				}
				c[i].contParent = contParent;
				if (contParent > maxParent) {
					maxParent = contParent;
				}
			}
			
			//create new childs to beauty map
			for(let i=0;i<c.length;i++){
				c[i].parentToCreate = maxParent - c[i].contParent;
				
				let pSlave	= tags.filter((r)=>{return r.istag && r.key == c[i].parent})[0];
				let pMaster	= tags.filter((r)=>{return r.istag && r.key == pSlave.parent})[0];
				let hasHelper = tags.filter((r)=>{return r.isHelper && r.parent == pSlave.parent});
				if(hasHelper.length==1){
					//YA CREO HELPERS BUSCAR PADRE
					let sH = true;
					hasHelper = hasHelper[0];
					while(sH){
						let auxHelper = tags.filter((r)=>{return r.isHelper && r.parent == hasHelper.key});
						if(auxHelper.length==1){
							hasHelper = auxHelper[0];
						}else{
							sH = false;
						}
					}
					pSlave.parent = hasHelper.key;
				}else{
					let keyParent = pSlave.parent;
					let keyBackup = null;
					for(let x=0;x<c[i].parentToCreate;x++){
						tags.push({key: key, name: "", parent: keyParent, isHelper: true});
						keyParent = key;
						key++;
					}
					pSlave.parent = keyParent;
				}
			}
		}*/
		/*

		for(let i=0;i<tags.length;i++){
			let CHILD = coll.filter((r)=>{return r.tag_main == tags[i].name;});
			if(CHILD.length>0){
				CHILD = CHILD.map((r)=>{return r.title;}).join("\n");
				tags.push({key: key, name: CHILD, parent: i});
				key++;
			}
		}*/
	}
});
