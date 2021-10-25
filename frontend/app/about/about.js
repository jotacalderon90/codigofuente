app.modules.about = new trascender({
	properties: {
		name: 'about', 
		label: 'Acerca de',
		icon: 'fa-info-circle'
	},
	start: function(){
		this.editHTML = new editHTML('/app/about/component.content.html','about_modal_main',this.parent);
	},
	open: function(){
		$('#about_modal_main').modal('show');
	}
});