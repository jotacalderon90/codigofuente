app.modules.push = new trascender({
	properties: {
		name: "push", 
		label: "Push", 
		icon: "fa-flash"
	},
    /*showApp: function(){
		return this.parent.socket.showApp() && this.parent.socket.connected==="1";
	},*/
	service: {
		subscribe: ["POST", "/api/push/subscribe"],
		unsubscribe: ["POST", "/api/push/unsubscribe"]
	},
	onload: function() {
		this.code = document.querySelector('.js-subscription-json');
		this.subscription = null;
		this.soported = true;
	},
	start: async function(){
		try{
			if (!('serviceWorker' in navigator && 'PushManager' in window)) {
				this.soported = false;
				document.querySelector('.btn-subscribe').innerHTML = "Service Worker o Push no soportado";
				return;
			}
			this.swRegistration = await navigator.serviceWorker.register("sw.js");
			this.serviceWorker = await navigator.serviceWorker.ready;
			this.subscription = await this.serviceWorker.pushManager.getSubscription();
			if(this.subscription!=null){
				this.code.innerHTML = JSON.stringify(this.subscription,null,"\r");
				this.qr();
				return;
			}
			if(pushcode==""){
				throw("No existe llave pública para notificaciones push");
			}
		}catch(e){
			alert(e);
			console.log(e);
		}
	},
	open: function(){
		//document.getElementById("push").parentNode.style.display = "block";
		if(this.subscription==null){
			$("#push_modal_form").modal('show');
		}else{
			$("#push_modal_share").modal('show');
		}
	},
	
	subscribe: async function(){
		try{
			$(".loader").fadeIn();
			document.querySelector('.btn-subscribe').disabled = true;
			this.subscription = await this.swRegistration.pushManager.subscribe({userVisibleOnly: true,applicationServerKey: pushcode});
			console.log(this.subscription);
			this.code.innerHTML = JSON.stringify(this.subscription,null,"\r");
			
			await this.service_subscribe({},this.subscription);
			
			document.querySelector('.btn-subscribe').disabled = false;
			this.qr();
			this.parent.refreshView();
			$("#push_modal_form").modal('hide');
			$("#push_modal_share").modal('show');
		}catch(e){
			if(e.toString().indexOf("gcm_sender_id")>-1){
				alert("Ups con gcm_sender_id");
			}else if(e.toString().indexOf('NotAllowedError')>-1){
				alert("Tiene bloqueada las notificaciones Push");
			}else{
				alert("ups, hubo un error: " + e.toString());
				console.log(e);
			}
			document.querySelector('.btn-subscribe').disabled = false;
		}
		$(".loader").fadeOut();
	},
	unsubscribe: async function(){
		try{
			if(confirm("Confirma desactivar la notificación?")){
				const razon = "razon desactivada";
				document.querySelector('.btn-unsubscribe').disabled = true;
				
				await this.service_unsubscribe({},{endpoint: this.subscription.endpoint, razon: razon});
				
				this.subscription.unsubscribe();
				this.subscription = null;
				this.code.innerHTML = "";
				document.querySelector('.btn-unsubscribe').disabled = false;
				this.parent.refreshView();
			}
		}catch(e){
			alert("ups, hubo un error: " + e.toString());
			console.log(e);
		}
	},
	qr: function(){
		QRCode.toCanvas(document.getElementById('push_canvas_share'), JSON.stringify(this.subscription), {errorCorrectionLevel: "L"}, (error)=>{
			if (error) {
				alert("Error");
				console.error(error);
			}
		})
	}
});