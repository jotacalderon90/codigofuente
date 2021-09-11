app.modules.donation = new trascender({
	properties: {
		name: 'donation', 
		label: ' ',
		icon: 'fa-heart'
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.filepath = btoa('/app/donation/index.html');
		this.service_read = this.serviceCreate('GET','/api/file/frontend/' + this.filepath);
		this.service_save = this.serviceCreate('PUT','/api/file/frontend/' + this.filepath);
		this.action = '';
	},
	start: function(){
		
	},
	open: function(){
		$('#donation_modal_main').modal('show');
	},
	edit: function(){
		document.getElementById('donation_editable').setAttribute('contenteditable', 'true'); 
		this.action = 'edit';
	},
	changeDonation: async function(){
		$('#donation_modal_main').modal('hide');
		let m;
		try{
			const current = await this.service_read({});
			const current_href = $(current).find('#donation_flow_editable').attr('href');
			const n = await this.parent.promise.prompt('Ingrese código donación Flow', 'text', '', current_href);
			const updated = current.replace(current_href,n);
			await this.service_save({},JSON.stringify({content: updated})); 
			m = 'Archivo modificado correctamente';
		}catch(e){
			m = e.error || e.toString();
		}
		await this.parent.promise.message('Aviso', m);
		document.getElementById('donation_editable').removeAttribute('contenteditable'); 
		this.action = '';
		$('#donation_modal_main').modal('show');
	},
	save: async function(){
		$('#donation_modal_main').modal('hide');
		$('.loader').fadeIn();
		let m;
		try{
			
			const current = await this.service_read({});
			const divisor1 = '<!--editable-->';
			const divisor2 = '<!--/editable-->';
			
			const ini = current.indexOf(divisor1); 
			const fin = current.indexOf(divisor2); 
			
			const updated = current.substr(0,ini) + document.getElementById('donation_editable').innerHTML.trim() + current.substr(fin + divisor2.length);
			
			await this.service_save({},JSON.stringify({content: updated})); 
			
			m = 'Archivo modificado correctamente';
		}catch(e){
			m = e.error || e.toString();
		}
		$('.loader').fadeOut();
		await this.parent.promise.message('Aviso', m);
		
		document.getElementById('donation_editable').removeAttribute('contenteditable'); 
		this.action = '';
		$('#donation_modal_main').modal('show');
	},
	canEdit: function(){
		return this.hasRole('root') || this.hasRole('admin');
	}
});