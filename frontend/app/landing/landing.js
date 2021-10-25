app.modules.landing = new trascender({
	properties: {
		name: "landing", 
		label: "Landing", 
		icon: "fa-html5"
	},
	showApp: function(){
		return true;
	},
	open: function(){
		$("#landing_modal_main").modal("show");
	}
});
