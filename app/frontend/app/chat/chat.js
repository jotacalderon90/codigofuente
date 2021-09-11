app.modules.chat = new trascender({
	properties: {
		name: "chat", 
		label: "Chat", 
		icon: "fa-wechat"
	},
	showApp: function(){
		return this.parent.contact.showApp();
	},
	onload: function(){
		this.password = this.getLS("app.chat.password","secret");
		this.myKey = this.random(10);
		this.message = "";
	},
	start: function(){
		
	},
	open: function(){
		//document.getElementById("chat").parentNode.style.display = "block";
		
		if(this.parent.socket.connected=="1"){
			this.parent.socket.server.on("mtc", (data) => {this.mtc(data)});
		}
		
		$("#chat_modal_room").modal("show");
		
	},
	openFromServer: async function(d){
		this.open();
		this.parent.refreshView();
	},
	
	putLS: function(){
		localStorage.setItem("app.chat.password",this.password);
	},
	getLS: function(key,def){
		return localStorage.getItem(key)||def;
	},
	mtc: function(data){
		data.msg = $.jCryption.decrypt(data.msg, this.password);
        data.msg = atob(data.msg);
        if (data.msg != "") {
            data.msg = JSON.parse(data.msg);
			
            const c = document.getElementById("chat_list");
            const li = document.createElement("li");

			if(data.msg.key==this.myKey){
				li.setAttribute("class", "list-group-item pull-right");
			}else{
				li.setAttribute("class", "list-group-item pull-left");
			}
			

            //CREATED
            const s = document.createElement("small");
            s.innerHTML = moment(new Date(data.time)).format("H:mm");

            //NICKNAME
            const b = document.createElement("b");
            b.innerHTML = data.msg.nickname;

            //MESSAGE
            const p = document.createElement("p");
            if (data.msg.message) {
                p.innerHTML = data.msg.message;
            }

            li.appendChild(s);
            li.appendChild(b);
            li.appendChild(p);
			
            c.appendChild(li);
			
			c.scrollTo(0,c.scrollHeight);
			//$("#list-group").scrollTo(0,$("#list-group").scrollHeight);
            //window.scrollTo(0, document.body.scrollHeight);
        }
	},
    keypress: function(event) {
        if (event.originalEvent.which == 13) {
            this.message = this.message.trim();
            if (this.message != "") {
                this.parent.socket.server.emit("mts", {
                    msg: $.jCryption.encrypt(btoa(JSON.stringify({
                        nickname: this.parent.account.doc.nickname,
                        message: this.message,
						key: this.myKey,
                    })), this.password)
                });
                this.message = "";
            }
        }
    },		
	random: function(length){
		let possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let text = "";
		for (let i = 0; i < length; i++){
			text += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
		}
		return text;
	}
});