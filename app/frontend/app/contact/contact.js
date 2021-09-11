app.modules.contact = new trascender({
	properties: {
		name: "contact", 
		label: "Contactos", 
		icon: "fa-users"
	},
	showApp: function(){
		return this.parent.push.showApp() && this.parent.push.subscription!==null;
	},
	service: {
		notificate: ["POST", "/api/push/notificate"]
	},
	onload: function(){
		let c = JSON.parse(this.getLS("app.contact.coll","[]"));
		c = c.map((r)=>{
			delete r["$$hashKey"];
			return r;
		});
		this.coll = c;
		this.scanner = null;
	},
	start: function(){
		
	},
	open: function(){
		$("#contact_modal_list").modal("show");
	},
	
	putLS: function(){
		localStorage.setItem("app.contact.coll",JSON.stringify(this.coll));
	},
	add: async function(content){
		try{
			let data;
			
			if(content){
				data = JSON.parse(content);
			}else{
				data = JSON.parse(prompt("Pegue el código push generado desde algun lector QR"));
			}
			
			if(!data){
				return;
			}
			if(data && data.endpoint && data.keys){
				let n = prompt("Ingrese un nombre");
				let doc = {nickname: n, push: data};
				this.coll.push(doc);
				this.putLS();
				$("#contact_modal_form").modal("hide");
				$("#contact_modal_list").modal("show");
			}else{
				throw("Captcha inválido");
			}
		}catch(e){
			alert("Error: " + e);
		}
	},
	addQR: async function(){
		try{
			
			const cameras = await Instascan.Camera.getCameras();
			
			$('#contact_modal_form').modal('hide');
			const c = [];
			for(let i=0;i<cameras.length;i++){
				c.push({label: cameras[i].name, value: i});
			}
			const camera = await this.parent.promise.selector('Seleccione camara', c);
			$('#contact_modal_form').modal('show');
			
			this.scanner = new Instascan.Scanner({ video: document.getElementById('contact_qr_reader'), scanPeriod: 5 });
			
			this.scanner.addListener('scan', (content, image) => {
				this.stopScanner();
				this.add(content);
				this.parent.refreshView();
			});
			
			this.scanner.start(cameras[parseInt(camera)]);
			this.parent.refreshView();
			
		}catch(e){
			alert(e);
		}
	},
	stopScanner: function(){
		this.scanner.stop();
		this.scanner = null;
	},
	remove: function(index){
		if(confirm("Confirme acción eliminar")){
			this.coll.splice(index,1);
			this.putLS();
		}
	},
	notify: async function(row){
		$('#contact_modal_list').modal('hide');
		const m = await this.parent.promise.prompt('Enviar notificación', 'text', 'Ingrese mensaje','');
		if(m.trim()==''){
			$('#contact_modal_list').modal('show');
			return;
		}
		await this.service_notificate({},{receptor: [row], body: m});
		await this.parent.promise.message('Aviso', 'La notificación ha sido enviada, pinche aceptar y espere en el chat por el destinatario');
		this.parent.pushStory('#contact_modal_list');
		this.parent.chat.open();
	},
	addMyself: function(){
		this.coll.push({nickname: "Tú", push: JSON.parse(this.parent.push.code.innerHTML)});
		this.putLS();
		$("#contact_modal_about").modal("hide");
		$("#contact_modal_list").modal("show");
	}
});