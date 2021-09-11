app.modules.users = new trascender({
	properties: {
		name: "users", 
		label: "Usuarios", 
		icon: "fa-users"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.started = false;
	},
	start: function(){
		
	},
	open: function(){
		if(!this.started){
			this.getTotal();
			this.started = true;
		}
		$(this.modal.list).modal("show");
	},
	increase: true,
	baseurl: "api/users",
	modal: {
		list: '#users_modal_list',
		doc: '#users_modal_document'
	},
	scroller: "#users_modal_list .modal-content",
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
			this.cant = await this.service_total({query: JSON.stringify({})});
			this.setPages();
			this.getCollection();
		}catch(e){
			alert("Error al obtener total de documentos");
			console.log(e);
		}
	},
	getCollection: async function(){
		try{
			$(".loader").fadeIn();
			let coll = await this.service_collection({
				query: JSON.stringify({}),
				options: JSON.stringify({
					limit: this.rowsByPage,
					skip: this.obtained,
					sort: this.sorted
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
		$(".loader").fadeOut();
	},
    
	create: async function(){
		try{
			const email = await this.parent.promise.prompt('Nuevo usuario', 'text', 'Email...','');
			await this.wait(500);
			const password = await this.parent.promise.prompt('Nuevo usuario', 'text', 'Contraseña...','');
			
			if(email.trim()=='' || password.trim()==''){
				return;
			}
			
			if(!this.isEmail(email)){
				throw('Email inválido');
			}
			
			if(!confirm("Confirme creación del documento")){
				return;
			}
			
			$(".loader").fadeIn();
			await this.service_create({},this.formatBody({email: email.trim(),password:password.trim()}));
			$(".loader").fadeOut();
			alert("Documento creado");
			this.getTotal();
		}catch(e){
			alert(e);
			console.log(e);
		}
		$(this.modal.list).modal("show");
	},
	delete: async function(id){
		try{			
			if(!confirm("Confirme eliminación del documento")){
				return;
			}
			$(".loader").fadeIn();
			await this.service_delete({id: id || this.doc._id});
			alert("Documento eliminado correctamente");
			this.getTotal();
			$(".loader").fadeOut();
		}catch(e){
			alert(e);
			console.log(e);
		}
	},
	activate: async function(row){
		try{
			const q = (row.activate)?"Deshabilitar":"Habilitar";
			if(!confirm('Confirma ' + q)){
				return;
			}
			$(".loader").fadeIn();
			await this.service_update({id: row._id},{type: 'activate'});
			alert("Documento actualizado correctamente");
			this.getTotal();
			$(".loader").fadeOut();
		}catch(e){
			alert(e);
			console.log(e);
		}
	},
	changePassword: async function(row){
		try{
			if(!confirm('Confirma querer cambiar contraseña')){
				return;
			}
			$(this.modal.list).modal("hide");
			const newpassword = await this.parent.promise.prompt('Cambiar contraseña', 'text', 'Ingrese nueva contraseña...','');
			if(newpassword.trim()==''){
				$(this.modal.list).modal("show");
				return;
			}
			$(".loader").fadeIn();
			await this.service_update({id: row._id},{type: 'password',password: newpassword});
			alert("Documento actualizado correctamente");
			this.getTotal();
			$(".loader").fadeOut();
			$(this.modal.list).modal("show");
		}catch(e){
			alert(e.error || e);
			console.log(e);
			$(".loader").fadeOut();
			$(this.modal.list).modal("show");
		}
	},
	enableRecovery: async function(row){
		try{
			if(!confirm('Confirma enviar correo de recuperación')){
				return;
			}
			$(".loader").fadeIn();
			await this.service_update({id: row._id},{type: 'notify'});
			$(".loader").fadeOut();
			alert("Notificacion enviada correctamente");
		}catch(e){
			alert(e.error || e);
			console.log(e);
			$(".loader").fadeOut();
		}
	},
	changeRoles: async function(row){
		try{
			$(this.modal.list).modal("hide");
			const newroles = await this.parent.promise.prompt('Actualizar roles', 'text', 'Ingrese roles separados por coma',row.roles.join(','));
			if(newroles.trim()==''){
				$(this.modal.list).modal("show");
				return;
			}
			$(".loader").fadeIn();
			await this.service_update({id: row._id},{type: 'roles',roles: newroles.split(',')});
			alert("Documento actualizado correctamente");
			this.getTotal();
			$(".loader").fadeOut();
			$(this.modal.list).modal("show");
		}catch(e){
			alert(e.error || e);
			console.log(e);
			$(".loader").fadeOut();
			$(this.modal.list).modal("show");
		}
	}
});