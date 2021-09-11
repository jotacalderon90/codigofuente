app.modules.mailing = new trascender({
	properties: {
		name: 'mailing', 
		label: 'Mailing',
		icon: 'fa-envelope'
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.to = '';
		this.subject = '';
		this.started = false;
		this.marcar_todo = true;
		this.sending_status = [];
		this.error_sending_status = [];
		this.enviando = false;
		this.users = {};
	},
	start: function(){
		
	},
	open: async function(){
		if(!this.started){
			await this.firstOpen();
		}
		$('#mailing_modal_form').modal('show');
	},
	service: {
		templates: ["GET", "/api/mailing/templates"],
		template_metadata: ["GET", "/api/mailing/templates/:id"],
		users_tag: ["GET", "/api/mailing/users/tag"],
		users: ["GET", "/api/mailing/users/:id"],
		message: ["POST","/api/mailing/message"]
	},
	firstOpen: async function(){
		try{		
			$('.loader').fadeIn();
			this.templates = await this.service_templates();
			this.users_tag = await this.service_users_tag();
			console.log(this.templates);
			this.new();
			this.parent.refreshView();
			$('.loader').fadeOut();	
		}catch(e){
			alert(e);
			console.log(e);
		}
		this.started = true;
	},
	default: function(){
		return {subject: '', to: '', message: ''};
	},
	selectTemplate: async function(){
		$('.loader').fadeIn();
		this.template_metadata = await this.service_template_metadata({id: this.template});
		console.log(this.template_metadata);
		$('#mailing_modal_form').find('iframe').attr('src','/mailing/templates/' + this.template);
		this.parent.refreshView();
		$('.loader').fadeOut();
	},
	selectRoles: async function(id){
		$('.loader').fadeIn();
		
		const u = await this.service_users({id: id});
		
		u.filter((r)=>{
			return !this.users[r.email];
		}).map((r)=>{
			this.users[r.email] = r;
		});
		
		this.newdoc.to += ((this.newdoc.to=='')?'':',') + u.map((r)=>{return r.email});
		this.parent.refreshView();
		$('.loader').fadeOut();
	},
	continue: function(){
		this.coll = this.newdoc.to.split(',').map((r)=>{return {email: r, activate: this.marcar_todo}});
		$('#mailing_modal_form').modal('hide');
		$('#mailing_modal_sending').modal('show');
	},
	marcar_todos: function(){
		this.coll = this.coll.map((r)=>{
			r.activate = this.marcar_todo
			return r;
		});
	},
	enviar: async function(){
		if(this.coll.filter((r)=>{return r.activate}).length==0){
			return;
		}
		if(!confirm('Confirma envío')){
			return;
		}
		this.enviando = true;
		for(let i=0;i<this.coll.length;i++){
			this.enviar_a_uno(this.coll[i],i);
		}
	},
	enviar_a_uno: async function(to,index){		
		if(!to.activate){
			return;
		}
		try{
			this.sending_status[index] = 1;
			const memo = {};
			memo.subject = this.newdoc.subject;
			memo.to = to.email;
			if(this.newdoc.tipo_envio=='plain'){
				memo.text = this.newdoc.message
			}else if(this.newdoc.tipo_envio=='template'){
				memo.template = this.template;
				for(var x=0;x<this.template_metadata.length;x++){
					let m = this.template_metadata[x];
					if(m.type=="static"){
						memo[m.label] = m.value;
					}else if(m.type=="document"){
						memo[m.label] = this.users[to.email][m.label];
					}
				}
			}
			await this.service_message({},this.formatBody(memo));
			this.sending_status[index] = 2;
		}catch(e){
			this.sending_status[index] = 3;
			this.error_sending_status[index] = e.error || e;
		}
		this.parent.refreshView();
	},
	getSendingStatus: function(index){
		return this.sending_status[index];
	},
	info_error: function(index){
		alert(this.error_sending_status[index]);
	},
	volver: function(){
		$('#mailing_modal_form').modal('show');
		$('#mailing_modal_sending').modal('hide');
		if(this.enviando){
			this.new();
		}
		this.enviando = false;
	}
});