app.modules.address = new trascender({
	properties: {
		name: 'address', 
		label: 'Dirección',
		icon: 'fa-map-marker'
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		const filepath = btoa('/app/address/index.html');
		this.service_read = this.serviceCreate('GET','/api/file/frontend/' + filepath);
		this.service_save = this.serviceCreate('PUT','/api/file/frontend/' + filepath);
	},
	start: function(){
		
	},
	open: function(){
		$('#address_modal_main').modal('show');
	},
	
	edit: async function(){
		let m;
		try{
			
			const current = await this.service_read({});
			
			const newcontent = await this.parent.promise.prompt('Modificar dirección', 'text', 'Ingrese HTML copiado de google maps',$(current).find('iframe')[0].outerHTML);
			
			if(newcontent.trim()==''){
				this.open();
				return;
			}
			
			const divisor1 = '<!--editable-->';
			const divisor2 = '<!--/editable-->';
			
			const ini = current.indexOf(divisor1); 
			const fin = current.indexOf(divisor2); 
			
			const updated = current.substr(0,ini) + divisor1 + '\n\t\t\t\t\t\t' + newcontent + '\n\t\t\t\t\t\t' + divisor2 + current.substr(fin + divisor2.length);
			
			await this.service_save({},JSON.stringify({content: updated})); 
			
			$('#address #address_modal_main .modal-body iframe').attr('src',$(newcontent).attr('src'));
			
			m = 'Dirección modificada correctamente';
		}catch(e){
			m = e.error || e.toString();
		}
		await this.parent.promise.message('Aviso', m);
		this.open();
	},
	canEdit: function(){
		return this.hasRole('root') || this.hasRole('admin');
	}
});