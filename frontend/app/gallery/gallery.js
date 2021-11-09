app.modules.gallery = new trascender({
	properties: {
		name: "gallery", 
		label: "Galería", 
		icon: "fa-file-image-o"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.service_collection = this.serviceCreate("GET","/api/gallery/collection");
		this.service_collection_file = this.serviceCreate("GET","/api/gallery/:id/collection");
		this.service_create = this.serviceCreate("POST","/api/gallery");
		this.service_update = this.serviceCreate("PUT","/api/gallery/:id");
		this.service_delete = this.serviceCreate("DELETE","/api/gallery/:id");
		this.service_delete_file = this.serviceCreate("DELETE","/api/gallery/:id/:file");
		$('form#gallery_file_upload').submit((e)=>{this.upload_file(e)});
		
		/*ABOUT*/
		this.filepath = btoa('/app/' + this.properties.name + '/about.html');
		this.service_about_read = this.serviceCreate('GET','/api/file/frontend/' + this.filepath);
		this.service_about_save = this.serviceCreate('PUT','/api/file/frontend/' + this.filepath);
		this.about_action = '';
	},
	start: function(){
		this.editHTML = new editHTML('/app/' + this.properties.name + '/about.html',this.properties.name + '_modal_about',this.parent);
		this.index_image = 0;
	},
	open: async function(){
		try{
			$(".loader").fadeIn();
			this.coll = await this.service_collection();
			$(".loader").fadeOut();
			console.log(this.coll);
			this.title = 'Galería';
			this.parent.refreshView();
			$("#gallery_modal_tag").modal("show");
		}catch(e){
			alert(e);
		}
	},
	read: async function(id){
		try{
			this.title = id;
			$("#gallery_file_upload").attr("action",'/api/gallery/' + id + '/uploader');
			$(".loader").fadeIn();
			this.doc = {
				title: id,
				title_backup: id,
				coll: await this.service_collection_file({id: id})
			}
			$(".loader").fadeOut();
			console.log(this.doc);
			this.parent.refreshView();
			$("#gallery_modal_list").modal("show");
		}catch(e){
			alert(e);
		}
	},
	upload_file: async function(e){
		$(".loader").fadeIn();
		/*e.preventDefault();
		const gfui = $('#gallery_file_upload input');
		const files = [];
		for(file in gfui[0].files){
			files.push(gfui[0].files[file]);
		}
		const fd = new FormData();
		fd.append('key', 'value');
		console.log(fd);
		fd.append('file[]', files);
		console.log(fd);
		$.post(gfui.attr("action"), fd, function(data) {
			alert(data);
			$(".loader").fadeOut();
		});*/
	},
	delete_file: async function(index){
		try{
			let n = this.doc.coll[index].split('/');
			n = n[n.length-1];
			if(confirm('desea eliminar la imagen ' + n)){
				$(".loader").fadeIn();
				await this.service_delete_file({id: this.doc.title_backup, file: n})
				this.doc.coll.splice(index,1);
				$(".loader").fadeOut();
				this.parent.refreshView();
			}
		}catch(e){
			alert(e);
		}
	},
		
	openCarousel: function(index){
		this.index_image = index;
		this.refreshCarousel();
		const d = '#gallery_div_img_carousel';
		document.querySelector(d).addEventListener('touchstart',(e)=>{this.handleTouchStart(e)});
		document.querySelector(d).addEventListener('touchmove',	(e)=>{this.handleTouchMove(e)});
		document.querySelector(d).addEventListener('touchend',	()=>{this.handleDetect()});
		document.querySelector(d).addEventListener('dblclick',	()=>{this.closeCarousel()});
		document.addEventListener('keydown',	(e)=>{this.galleryKeyEvent(e)});
		$(d).fadeIn();
	},
	refreshCarousel: function(){
		$('#gallery_img_carousel').attr('src',this.doc.coll[this.index_image]);
	},
	closeCarousel: function(){
		const d = '#gallery_div_img_carousel';
		document.querySelector(d).removeEventListener('touchstart',(e)=>{this.handleTouchStart(e)});
		document.querySelector(d).removeEventListener('touchmove',	(e)=>{this.handleTouchMove(e)});
		document.querySelector(d).removeEventListener('touchend',	()=>{this.handleDetect()});
		document.querySelector(d).removeEventListener('dblclick',	()=>{this.closeCarousel()});
		document.removeEventListener('keydown',	(e)=>{this.galleryKeyEvent(e)});
		$(d).fadeOut();
	},
		
	/**************/
	/*MOBILE TOUCH*/
	/**************/
	
	handleDetect: function(){
		switch(this.detectSwipe){
			case 'left':
				if(this.index_image < this.doc.coll.length-1){
					this.index_image++;
					this.refreshCarousel();
				}else{
					this.index_image = 0;
					this.refreshCarousel();
				}
			break;
			case 'right':
				if(this.index_image>0){
					this.index_image--;
					this.refreshCarousel();
				}else{
					this.index_image = this.doc.coll.length-1;
					this.refreshCarousel();
				}
			break;
			case 'up':
				this.closeCarousel();
			break;
		}
		this.detectSwipe = null;
	},
	
	/*************/
	/*galleryKeyEvent*/
	/*************/
	galleryKeyEvent: function(e){
		switch(e.keyCode){
			case 38://UP
			break;
			case 40://DOWN
			break;
			case 39://Right
				this.detectSwipe='left';
				this.handleDetect();
			break;
			case 37://LEFT
				this.detectSwipe='right';
				this.handleDetect();
			break;
		}
	},
	
	/**************/
	/*CUD WORKFLOW*/
	/**************/
	
	beforeCUD: function(title){
		if(!confirm("Confirme " + title)){
			return;
		}
		$("#gallery_modal_form").modal('hide');
		$(".loader").fadeIn();
		return true;
	},
	beforeCreate: function(){
		return this.beforeCUD('creación');
	},
	paramsToUpdate: function(){
		return {id: this.doc.title_backup};
	},
	beforeUpdate: function(){
		return this.beforeCUD('actualización');
	},
	paramsToDelete: function(){
		return {id: this.doc.title};
	},
	beforeDelete: function(){
		return this.beforeCUD('eliminación');
	},
	afterCUD: async function(s,r){
		$(".loader").fadeOut();	
		if(!s){
			await this.parent.promise.message('ERROR', r.json.error);
		}
		this.open();
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
		return {title: ''};
	},
	
	/*****/
	/*CAN*/
	showFooter: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole('gallery');
	},
	canCreate: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole('gallery');
	},
	canEdit: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole('gallery');
	}
	
});
