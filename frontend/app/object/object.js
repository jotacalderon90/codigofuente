app.modules.object = new trascender({
	properties: {
		name: "object", 
		label: "Objetos", 
		icon: "fa-cubes"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.options.projection = {name: 1, label: 1};
		this.main_modal = '#object_modal_list';
		this.started = false;
	},
	start: function(){
		//this.restart();
	},
	open: function(){
		if(!this.started){
			this.restart();
			this.started = true;
		}
		$(this.main_modal).modal("show");
	},
    
	restart: function(){
		this.action = null;
		this.obtained = 0;
		this.coll = [];
		this.getTotal();
	},
	increase: true,
	backto: undefined,
    baseurl: "api/document/object",
    
	default: function() {
        return {
			name: "",
			schema: {}
        };
    },
	new: function(){
		this.backto = "#object_modal_list";
		this.action = "new";
		this.newdoc = this.formatToClient(this.default());
		this.afterChangeMode("new",this.newdoc);
		$('#object_modal_form').modal('show');
	},
    
	formatToClient: function(doc) {
		doc.content = JSON.stringify(doc, undefined, "\t");
        doc.label = (doc.label) ? doc.label : doc.name;
		if(doc.schema){
			doc.cols = 0;
			for (attr in doc.schema) {
				doc.cols++;
			}
		}
        return doc;
    },
    
	afterGetTotal: function() {
        this.getCollection();
    },
    afterGetCollection: function() {
        if (this.obtained < this.cant) {
            this.getCollection();
        } else {
            this.coll = this.SOABF(this.coll, "label");
			this.parent.refreshView();
        }
    },
	
	create: async function(){
		try{
			if(!confirm("Confirme creación del documento")){
				return;
			}
			let doc = JSON.parse(this.newdoc.content.split("\n").join(""));
			if(!doc.name || doc.name.trim()==""){
				throw("Nombre inválido");
			}
			if(this.coll.filter((r) => {return r.name.toLowerCase() == doc.name.toLowerCase();}).length!=0){
				throw("El objeto " + doc.name + " ya existe");
			}
			$(".loader").fadeIn();
			let c = await this.service_create(this.paramsToCreate(),this.formatBody(doc));
			alert("Objeto creado");
		}catch(e){
			alert(e);
			console.log(e);
		}
		this.restart();
		this.parent.close();
		$(".loader").fadeOut();
		$('#object_modal_form').modal('hide');
	},
	read: async function(id){
		try{
			$(".loader").fadeIn();
			this.backto = "#object_modal_list";
			this.action = "read";
			this.doc = await this.service_read({id: id});
			this.doc = this.formatToClient(this.doc);
			this.parent.refreshView();
		}catch(e){
			alert(e);
			console.log(e);
		}
		$(".loader").fadeOut();
		//$('#object_modal_form').modal('show');
	},
	update: async function(){
		try{
			if(!confirm("Confirme actualización del documento")){
				return;
			}
			let doc = JSON.parse(this.doc.content.split("\n").join(""));
			if(!doc.name || doc.name.trim()==""){
				throw("Nombre inválido");
			}
			if(this.coll.filter((r) => {return r.name.toLowerCase() == doc.name.toLowerCase() && r._id != doc._id;}).length!=0){
				throw("El objeto " + doc.name + " ya existe");
			}
			$(".loader").fadeIn();
			let c = await this.service_update({id: this.doc._id},this.formatBody(doc));
			alert("Objeto actualizado correctamente");
		}catch(e){
			alert(e);
			console.log(e);
		}
		
		this.restart();
		this.parent.close();
		$(".loader").fadeOut();
		$('#object_modal_form').modal('hide');
	},
	delete: async function(){
		try{
			if(!confirm("Confirme eliminación del documento")){
				return;
			}
			$(".loader").fadeIn();
			let c = await this.service_delete({id: this.doc._id});
			alert("Objeto eliminado correctamente");
			
		}catch(e){
			alert(e);
			console.log(e);
		}
		this.restart();
		this.parent.close();
		$(".loader").fadeOut();
		$('#object_modal_form').modal('hide');
	},
    
	getOutput: function() {
        return (!this.doc) ? "" : (this.doc.output) ? this.doc.output : this.doc.schema;
    },
	
	openAPPCollection: function(){
		this.parent.collection.openFromAPPObject(this.getDoc()._id);
	}
});