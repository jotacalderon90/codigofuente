app.modules.product = new trascender({
	properties: {
		name: "product", 
		label: "Productos", 
		icon: "fa-file-text"
	},
	showApp: function(){
		return true;
	},
	baseurl: "api/product",
	scroller: ['#product_modal_list .modal-content','#product_modal_tag .modal-content'],
	projection: {uri: 1,thumb: 1,resume: 1,title: 1,created: 1,price: 1},
	sorted: {created: -1},
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
		$("#" + this.properties.name + "_input_tag").autocomplete({source: this.tag, select: ( event, ui )=>{
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
				$('#' + this.properties.name + '_modal_form form').attr('action',"/api/" + this.properties.name + "/" + ((this.doc)?this.doc._id:"") + "/image");
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
	getTag: async function(){
		try{
			
			this.tag = await this.service_tag();
			this.tag = this.tag.map((r)=>{return {label: r}});
			console.log(this.tag);
			
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
			this.fulltext = await this.parent.promise.prompt('Buscar', 'text', 'Ingrese criterio de b??squeda...','');
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
		this.sorted.created = this.sorted.created * -1;
		this.restart();
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
				throw("No se encontr?? el documento con URL " + uri);
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
		$('#' + this.properties.name + '_modal_list').modal('show');
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
	
	/********/
	/*FORMAT*/
	/********/
	
	formatToClient: function(row){
		row.datefromnow = moment(new Date(row.created), "YYYYMMDD, h:mm:ss").fromNow();
		row.datetitle = moment(new Date(row.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
		return row;
	},
	formatToServer: function(doc){
		delete doc.datefromnow;
		delete doc.datetitle;
		delete doc.tagbk;
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
		return this.beforeCUD('creaci??n');
	},
	beforeUpdate: function(){
		return this.beforeCUD('actualizaci??n');
	},
	beforeDelete: function(){
		return this.beforeCUD('eliminaci??n');
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
		return {title: '', tag: []};
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
	
	/***********/
	/*ECOMMERCE*/
	/***********/
	
	updateCart: function(row){
		const newp = row._id + "##" + row.title + "##" + row.price + "##" + 1 + "##" + row.dcto + "##" + row.img;
		let cart = localStorage.getItem("cart");
		if(cart==null || cart.trim()==""){
			cart = newp;
		}else{
			cart = atob(cart) + "||" + newp;
		}
		localStorage.setItem("cart",btoa(cart));
		
		$("#product_modal_document").modal('hide');
		this.parent.ecommerce.open();
	}
});
