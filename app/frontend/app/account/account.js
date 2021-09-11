app.modules.account = new trascender({
	properties: {
		name: "account", 
		label: "Cuenta", 
		icon: "fa-user-circle",
		version: "0.0.2"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.isLogged = (Object.entries(user).length !== 0);
		if(this.isLogged){
			this.doc = user;
		}
		this.service_googleauth = this.serviceCreate("GET","/api/account/google_auth");
		this.started = false;
	},
	start: async function(){
		/*try{
			this.googleauth = await this.service_googleauth();
		}catch(e){
			console.log(e);
		}*/
		//setTimeout(()=>{ this.setDevice()}, 1000);
	},
	open: async function(){
		if(!this.started){
			this.googleauth = await this.service_googleauth();
			this.parent.refreshView();
			this.started = true;
		}
		
		//document.getElementById("account").parentNode.style.display = "block";
		if(this.isLogged){
			this.putLS('oneLogged',"1");
			$("#account_modal_info").modal('show');
		}else if(this.getLS('oneLogged')!=='1'){
			$("#account_modal_select_option").modal('show');
		}else{
			$("#account_modal_login").modal('show');
		}
	},
	
	getLS: function(key,def){
		return localStorage.getItem("app" + "." + this.properties.name + "." + key)||def;
	},
	putLS: function(key,value){
		localStorage.setItem("app" + "." + this.properties.name + "." + key,value);
	},
	/*isAdmin: function(){
		return (this.doc && this.doc.roles && this.doc.roles.indexOf("admin")>-1)?true:false;
	},*/
	//FROM SERVER
	recovery: function(){
		$("#account_modal_recovery").modal('show');
	},
	
	/********/
	/*DEVICE*/
	/********/
	
	setDevice: function(){
		const cv = this.getLS("lasVersion");
		if(cv!=this.properties.version){
			this.parent.application.menuFadeOut();
			this.workflow("1");
		}else{
			console.log("El usuario ya realizo el workflow, se llama: " + this.getLS('nickname'));
		}
	},
	setRandomNumber: function(length){
		let possibleChar = "0123456789";
		let text = "";
		for (let i = 0; i < length; i++){
			text += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
		}
		return text;
	},
	workflow: function(action){
		switch(action){
			case "1":
				this.parent.alert.prompt('Nuevo dispositivo','Favor ingrese su nombre','1.1',this.properties.name);
				break;
			case "1.1":
				this.putLS('nickname',this.parent.alert.getResponse().trim());
				if(this.getLS('nickname')==="" || this.getLS('nickname')===undefined){
					this.putLS('nickname',"anon" + this.setRandomNumber(7));
				}
				this.parent.socket.server.emit("mta", {msg: 'nuevo dispositivo identificado como ' + this.getLS('nickname') + '!'});
				this.parent.alert.alert('Disculpe las molestias', 'Ahora puede navegar por la aplicación',this.properties.name);
				this.putLS('lasVersion',this.properties.version);
				this.parent.application.menuToggle();
				break;
			/*case "1":
				this.parent.alert.ask('Usuario desconocido','Hola, creo que no lo conozco, es primera vez que ingresa ¿cierto?',[['1.1','SI'],['1.2','NO']],this.properties.name);
				break;
			case "1.1":
				this.parent.socket.server.emit("mta", {msg: 'nuevo usuario en el sistema!'});
				this.parent.alert.ask('Disculpe las molestias','Para que no se vuelva a repetir esta situación ¿podría darme su nombre?',[['1.1.1','SI'],['1.1.2','NO']],this.properties.name);
				break;
			case "1.1.1":
				this.parent.alert.prompt('Solicitud de información','Favor ingrese su nombre','1.1.1.1',this.properties.name);
				break;
			case "1.1.1.1":
				this.putLS('nickname',this.parent.alert.getResponse().trim())
				if(this.getLS('nickname')==="" || this.getLS('nickname')===undefined){
					this.workflow('1.1.1');
				}else{
					console.log(this.getLS('nickname'));
					this.parent.alert.alert('Gracias por su paciencia', 'Ahora puede navegar por la aplicación',this.properties.name);
					this.putLS('lasVersion',this.properties.version);
					this.parent.application.menuToggle();
				}
				break;
			case "1.1.2":
				this.putLS('nickname',"anon" + this.setRandomNumber(7));
				console.log(this.getLS('nickname'));
				this.parent.alert.alert('Disculpe las molestias', 'Ahora puede navegar por la aplicación',this.properties.name);
				this.putLS('lasVersion',this.properties.version);
				this.parent.application.menuToggle();
				break;
			case "1.2":
				this.parent.socket.server.emit("mta", {msg: 'nuevo usuario indica que no es primera vez que ingresa'});
				this.parent.alert.ask('Usuario desconocido','Disculpeme pero no tengo registrado su dispositivo ¿podría darme su nombre?',[['1.1.1','SI'],['1.1.2','NO']],this.properties.name);
				break;*/
		}
	}
});