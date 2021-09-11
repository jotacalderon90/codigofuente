app.modules.background = new trascender({
	properties: {
		name: "background", 
		label: "Background",
		icon: "fa-image"
	},
	showApp: function(){
		return (user && user.roles && (user.roles.indexOf('root')>-1 || user.roles.indexOf('admin')>-1));
	},
	onload: function(){
		this.defaultURL = "/assets/media/img/background/main.jpg";
		this.uploadService = this.serviceCreate("POST","/api/background/image");
		document.getElementById("background_file_device").addEventListener("change", ()=>{this.loadImage()}, true);
	},
	start: function(){
		this.url = this.getLS("url",this.defaultURL);
		this.refreshBackground();
	},
	open: function(){
		$("#background_modal_form").modal('show');
	},
	
	getLS: function(key,def){
		return localStorage.getItem("app" + "." + this.properties.name + "." + key)||def;
	},
	putLS: function(key,value){
		localStorage.setItem("app" + "." + this.properties.name + "." + key,value);
	},
	refreshBackground: function(){
		$("body").css("background-image","url('" + this.url + "')");
	},
    camera: async function() {
        try {
            const data = await Capacitor.Plugins.Camera.getPhoto({resultType: "Base64"});
			this.url = "data:image/png;base64," + data.base64String;
			this.putLS('url',this.url);
			this.refreshBackground();
			this.open();
			this.parent.refreshView();
        } catch (e) {
            alert(e);
            console.log(e);
        }
    },
	setDefault: function(p){
		if(p && !confirm("¿Desea reestablecer los valores predeterminados?")){
			return;
		}
		this.url = this.defaultURL;
		this.putLS('url',this.url);
		this.refreshBackground();
	},
	download: function(){
		const a = document.createElement("a");
		a.href = this.url;
		a.download = "pwa.trascender." + (new Date()).toLocaleString() + ".png";
		a.click();
	},
	device: function(){
		$("#background_file_device").click();
	},
	copyLink: function(){
		let u = prompt("Pegue el vínculo de una imágen");
		if(u){
			this.url = u;
			this.putLS('url',this.url);
			this.refreshBackground();
		}
	},
	loadImage: async function(){
		const file = document.querySelector('#background_file_device').files[0];
		if(file.type!="image/jpeg"){
			alert(file.type + " invalid");
			return;
		}
		this.url = await this.imgToBase64(file);
		this.putLS('url',this.url);
		this.refreshBackground();
		this.parent.refreshView();
	},
	imgToBase64: function(file){
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = error => reject(error);
		})
	},
	upload: async function(){
		try{
			$(".loader").fadeIn();
			if(confirm('confirma subir imagen a servidor')){
				await this.uploadService({},this.formatBody({url: this.url}));
			}
		}catch(e){
			alert(e);
		}
		$(".loader").fadeOut();
	},
	canEdit: function(){
		return this.hasRole('root') || this.hasRole('admin');
	}
});