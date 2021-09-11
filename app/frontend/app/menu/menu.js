app.modules.menu = new trascender({
	properties: {
		name: "menu", 
		label: "Menú", 
		icon: "fa-bars"
	},
	showApp: function(){
		return false;
	},
	onload: function(){
		//$("#menu .btn-group").css('display','none');
		//this.coll = [];
	},
	start: function(){	
		this.coll = this.parent.modules.map((r)=>{return this.parent[r].properties});//.filter((r)=>{return r.noApp===undefined});
		//this.coll = this.SOABF(this.coll,"label");
		//para reiniciar memoria en desarrollo
		//this.lastApps = [null,null,null,null];
		//this.putLS("lastApps",JSON.stringify(this.lastApps));
		//this.coll_to_menu = [this.coll.filter((r)=>{return r.name===this.properties.name})[0]];
		this.lastApps = JSON.parse(this.getLS("lastApps","[null,null,null,null]"));
		this.refreshSelectAppsInMenu();
		
	},
	open: function(){
		$("#menu_modal_list").modal("show");
	},
	fadeIn: function(){
		$("#menu .btn-group").fadeIn();
	},
	fadeOut: function(){
		$("#menu .btn-group").fadeOut();
	},
	refreshSelectApps: function(app){
		this.fadeOut();
		if(app===this.properties.name){
			return;
		}
		if(app===this.lastApps[0]){
			return;
		}
		if(this.lastApps.indexOf(app)>-1){
			this.lastApps.splice(this.lastApps.indexOf(app),1);
			this.lastApps.unshift(app);
		}else{
			this.lastApps.pop();
			this.lastApps.unshift(app);
		}
		this.putLS("lastApps",JSON.stringify(this.lastApps));
		this.refreshSelectAppsInMenu();
		
	},
	refreshSelectAppsInMenu: function(){
		let coll = [];
		for(let i=0;i<this.lastApps.length;i++){
			if(this.lastApps[i]!=null){
				let a = this.coll.filter((r)=>{return r.name===this.lastApps[i]});
				if(a.length===1 && this.parent[a[0].name].showApp()){
					coll.push(a[0]);
				}
			}
		}
		coll.push(this.coll.filter((r)=>{return r.name===this.properties.name})[0]);
		this.coll_to_menu = coll;
	}
});