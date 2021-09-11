app.modules.socket = new trascender({
	properties: {
		name: "socket", 
		label: "Socket", 
		icon: "fa-snowflake-o"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.connected = this.getLS("app.socket.connected","1");
		if(this.connected==="1"){
			this.connect();
		}
	},
	start: function(){
	
	},
	open: function(){
		$("#socket_modal_form").modal('show');
	},
	
	putLS: function(){
		localStorage.setItem("app.socket.connected",this.connected);
	},
	connect: function(){
		this.connected = "1";
		this.ws = new WebSocket("ws://localhost/socketserver", "echo-protocol");
		this.ws.onerror = (event) => {this.onerror(event)};
		this.ws.onopen = (event) => {this.onopen(event)};
		this.ws.onmessage = (data) => {this.onmessage(data)};
		this.putLS();
	},
	onerror: function(event){
		console.error("Error en el WebSocket detectado:", event);
	},
	onopen: function(event){
		//console.log('onopen');
		//console.log(event);
		//this.ws.send('{}');
	},
	onmessage: function(message){
		try{
			const d = JSON.parse(message.data);
			this.parent[d.app][d.onresponse](d);
		}catch(e){
			alert('socket.onmessage.error.' + e.toString());
			console.log(e);
		}
	},
	disconnect: function(){
		if(confirm("Confirme desconección")){
			this.connected = "0";
			this.putLS();
			//this.server.close();
		}
	}
});