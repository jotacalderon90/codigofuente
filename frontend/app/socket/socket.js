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
		if (host.indexOf("localhost") > -1) {
			this.server = io({transports: ['websocket']});
		} else {
			const h = host;
			const o = (h.indexOf("https://") > -1) ? {secure: true} : {};
			this.server = io(h, o);
		}
		this.putLS();
	},
	disconnect: function(){
		if(confirm("Confirme desconección")){
			this.connected = "0";
			this.putLS();
			this.server.close();
		}
	}
});