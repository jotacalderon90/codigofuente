app.modules.collection = new trascender({
	properties: {
		name: "collection", 
		label: "Documentos", 
		icon: "fa-database"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.service_import = this.serviceCreate("POST","/api/document/:name/import");
		this.main_modal = '#collection_modal_list';
		this.fulltext = '';
		this.started = false;
	},
	start: function(){
		
	},
	open: function(){
		if(!this.started){
			if(!this.parent.object.started){
				this.parent.object.restart();
				this.parent.object.started = true;
			}
			this.started = true;
		}
		this.fulltext = '';
		$('#collection_modal_list').modal("show");
	},
	
	restart: function(){
		this.obtained = 0;
		this.coll = [];
		this.getTotal();
	},
	increase: true,
	baseurl: "api/document/:name",
	
	default: function() {
        return {
            _content: JSON.stringify(this.parent.object.doc.schema, undefined, "\t")
        };
    },
	new: function(){
		this.action = "new";
		this.newdoc = this.default();
		$(this.modal.list).modal("hide");
		$(this.modal.doc).modal("show");
	},
    
	formatToClient: function(doc) {
        doc._content = JSON.stringify(this.doc, undefined, "\t");
        return doc;
    },
	
	getTotal: async function(){
		try{
			this.obtained = 0;
			this.coll = [];
			this.updateQuery();
			this.cant = await this.service_total({name: this.parent.object.doc.name, query: JSON.stringify(this.query)});
			this.setPages();
			this.getCollection();
		}catch(e){
			alert("Error al obtener total de documentos");
			console.log(e);
		}
	},
	getCollection: async function(){
		try{
			//$(".loader").fadeIn();
			this.updateQuery();
			let coll = await this.service_collection({
				name: this.parent.object.doc.name,
				query: JSON.stringify(this.query),
				options: JSON.stringify({
					limit: this.rowsByPage,
					skip: this.obtained,
					sort: (this.parent.object.doc.sort) ? this.parent.object.doc.sort : {}
				})
			});
			coll = this.formatCollectionToClient(coll);
			this.obtained += coll.length;
			if(this.increase){
				this.coll = this.coll.concat(coll);
			}else{
				this.coll = coll;
			}
			console.log(this.coll);
			this.parent.refreshView();
		}catch(e){
			alert("Error al obtener colección de documentos");
			console.log(e);
		}
		//$(".loader").fadeOut();
	},
    search: async function(){
		try{
			$("#collection_modal_list").modal("hide");
			this.fulltext = await this.parent.promise.prompt('Buscar', 'text', 'Ingrese criterio de búsqueda...','');
			$("#collection_modal_list").modal("show");
			if(this.fulltext.trim()!=''){
				this.restart();	
			}
		}catch(e){
			alert(e);
		}
	},
	
	create: async function(){
		$(this.modal.doc).modal('hide');
		const c = await this.parent.promise.confirm('Confirmación', 'Confirme creación del documento');
		if(!c){
			$(this.modal.doc).modal('show');
			return;	
		}
		let m = '';
		try{
			$(".loader").fadeIn();
			const doc = JSON.parse(this.newdoc._content.split("\n").join(""));
			await this.service_create({name: this.parent.object.doc.name},this.formatBody(doc));
			m = 'Documento creado';
		}catch(e){
			console.log(e);
			m = e.error || e.toString();
		}
		$(".loader").fadeOut();
		await this.parent.promise.message('Aviso', m);
		this.closeDoc();
		this.restart();
	},
	read: async function(id){
		try{
			$(".loader").fadeIn();
			this.action = "read";
			this.doc = await this.service_read({name: this.parent.object.doc.name, id: id});
			this.doc = this.formatToClient(this.doc);
			console.log(this.doc);
			$(this.modal.list).modal("hide");
			$(this.modal.doc).modal("show");
			this.parent.refreshView();
		}catch(e){
			alert("Error al leer documento");
			console.log(e);
		}
		$(".loader").fadeOut();
	},
	update: async function(){
		$(this.modal.doc).modal('hide');
		const c = await this.parent.promise.confirm('Confirmación', 'Confirme actualización del documento');
		if(!c){
			$(this.modal.doc).modal('show');
			return;	
		}
		let m = '';
		try{
			$(".loader").fadeIn();
			const doc = JSON.parse(this.doc._content.split("\n").join(""));
			await this.service_update({name: this.parent.object.doc.name, id: this.doc._id},this.formatBody(doc));
			m = 'Documento actualizado';
		}catch(e){
			console.log(e);
			m = e.error || e.toString();
		}
		$(".loader").fadeOut();
		await this.parent.promise.message('Aviso', m);
		this.closeDoc();
		this.restart();
	},
	delete: async function(){
		$(this.modal.doc).modal('hide');
		const c = await this.parent.promise.confirm('Confirmación', 'Confirme eliminación del documento');
		if(!c){
			$(this.modal.doc).modal('show');
			return;	
		}
		let m = '';
		try{
			$(".loader").fadeIn();
			await this.service_delete({name: this.parent.object.doc.name, id: this.doc._id});
			m = 'Documento eliminado';
		}catch(e){
			console.log(e);
			m = e.error || e.toString();
		}
		$(".loader").fadeOut();
		await this.parent.promise.message('Aviso', m);
		this.closeDoc();
		this.restart();
	},
	
	scroller: "#collection_modal_list .modal-content",
	modal: {
		list:	"#collection_modal_list",
		doc:	"#collection_modal_document"
	},
	
	openFromAPPObject: async function(id_object){
		await this.selectObject(id_object);
		this.open();
	},
    selectObject: async function(id_object){
		try{
			
			if(id_object===undefined){
				console.log(this.parent.promise);
				id_object = await this.parent.promise.selector('Buscar', [{label: '- - Volver - -',value: ''}].concat(this.parent.object.coll.map((r)=>{return {label: ((r.label)?r.label:r.name), value: r._id}})), this.open);
				$('#collection_modal_list').modal('show');
			}
			
			if(id_object==""){
				this.obtained = 0;
				this.coll = [];
				this.parent.object.action = null;
				this.parent.refreshView();
				return;
			}
			//cargar objeto desde otro modulo
			await this.parent.object.read(id_object);
				
			//parche mas adelante mejorar
			if (this.parent.object.doc.service) {
				for (s in this.parent.object.doc.service) {
					//console.log(s);
					//console.log(this.parent.object.doc.service[s].method);
					//console.log(this.parent.object.doc.service[s].uri);
					//console.log(this["service_" + s]);
					//console.log(this.serviceCreate);
					this["service_" + s] = this.serviceCreate(this.parent.object.doc.service[s].method.toUpperCase(), this.parent.object.doc.service[s].uri);
					//console.log(this["service_" + s]);
				}
			} else {
				this.createServices();
			}

			this.wantFilter = false;
			this.filter = {};
			for (attr in this.parent.object.getOutput()) {
				this.filter[attr] = "";
			}
			this.updateQuery();
			this.getTotal();
		}catch(e){
			alert(e);
		}
	},
    updateQuery: function() {
        this.query = {};
        for (attr in this.filter) {
            if (this.filter[attr].trim() != "") {
                this.query[attr] = {
                    $regex: ".*" + this.filter[attr] + "*."
                };
            }
        }
		if(this.fulltext.trim()!=""){
			this.query["$text"] = {"$search": this.fulltext};
		}else{
			delete this.query["$text"];
		}
    },
	closeDoc: function(){
		this.newdoc = null;
		this.doc = null;
		$(this.modal.list).modal("show");
		$(this.modal.doc).modal("hide");
	},
	import: async function(){
		try{
			$('#collection_modal_list').modal('hide');
			const uri = await this.parent.promise.prompt('Servicio de datos', 'text', 'Ingrese url del servicio de datos...','');
			$('#collection_modal_list').modal('show');
			$(".loader").fadeIn();
			await this.service_import({name: this.parent.object.doc.name},{uri: uri});
			$(".loader").fadeOut();
			alert("importación realizada con éxito");
			this.restart();
		}catch(e){
			alert(e);
			console.log(e);
		}
	},
	getALL: async function() {
        try {
            let coll = await this.service_collection({
                name: this.parent.object.doc.name,
                query: "{}",
                options: "{}"
            });
            $("#modalAll").modal("show");
            this.all = JSON.stringify(coll);
        } catch (e) {
            alert(e);
        }
    },
    upALL: async function() {
        try {
            let coll = JSON.parse(this.all);
            for (let i = 0; i < coll.length; i++) {
                delete coll[i]._id;
                await this.service_create({
                    name: this.parent.object.doc.name
                }, JSON.stringify(coll[i]));
            }
            alert("documentos subidos");
            $("#modalAll").modal("hide");
            this.getTotal();
        } catch (e) {
            alert(e);
        }
    },
	
	openForm: function(){
		let m;
		if(this.parent.object.doc.modal && this.parent.object.doc.modal.form){
			m = this.parent.object.doc.modal.form;
		}else{
			m = this.parent.object.doc.name + '_modal_form';
		}
		if($('#' + m).length > 0){
			if(this.isReadMode()){
				this.parent[this.parent.object.doc.name].read(this.doc._id);
			}else if(this.isEditMode()){
				this.parent[this.parent.object.doc.name].edit(this.doc);
			}else if(this.isCreateMode()){
				this.parent[this.parent.object.doc.name].new();
			}
			$('#collection_modal_document').modal('hide');
			$('#' + m).modal('show');
		}else{
			alert('sin vista formulario');
			this.parent.close();
		}
	}
});