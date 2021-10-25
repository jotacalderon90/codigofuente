app.modules.poll = new trascender({
	properties: {
		name: 'poll', 
		label: 'Encuestas',
		icon: 'fa-question'
	},
	showApp: function(){
		return (user && user.roles && (user.roles.indexOf('root')>-1 || user.roles.indexOf('admin')>-1));
	},
	onload: function(){
		this.started = false;
		this.options.projection = {"title":1,"status":1};
		CKEDITOR.replace("poll_input_content");
		this.service_users_tag = this.serviceCreate("GET", "/api/poll/users/tag");
		this.service_users = this.serviceCreate("GET", "/api/poll/users/:id");
		this.users = {};
		
		this.service_start = this.serviceCreate("PUT", "/api/poll/start/:id");
		this.service_notify = this.serviceCreate("PUT", "/api/poll/notify/:id/:to");

		this.sending_status = [];
		this.error_sending_status = [];
	},
	start: function(){
	},
	open: async function(){
		if(!this.started){
			this.firstTime();
		}
		$('#poll_modal_list').modal('show');
	},
	baseurl: "api/poll",
	firstTime: async function(){
		try{
			this.users_tag = await this.service_users_tag();
			this.getTotal();
		}catch(e){
			alert(e);
			console.log(e);
		}
		this.started = true;
	},
	beforeGetTotal: function(){
		this.obtained = 0;
		this.coll = [];
		return true;
	},
	afterGetTotal: function(){
		this.getCollection();
	},
	beforeGetCollection: function(){
		$('.loader').fadeIn();
		return true;
	},
	afterGetCollection: function(){
		$('.loader').fadeOut();	
		this.parent.refreshView();
	},
	default: function(){
		return {title: "", content: "", accounts: [], options: [], status: "Inicial", private: false, anon: false, anons: []};
	},
	afterChangeMode: function(action,doc){
		switch(action){
			case "new":
				CKEDITOR.instances["poll_input_content"].setData("");
				CKEDITOR.instances["poll_input_content"].setReadOnly(false);
			break;
			case "read":
				CKEDITOR.instances["poll_input_content"].setReadOnly(true);
				this.read(this.doc._id);
			break;
			case "edit":
				CKEDITOR.instances["poll_input_content"].setReadOnly(false);
			break;
		}
	},
	formatToClient: function(doc){
		if(this.reading){
			doc.sending = (typeof doc.accounts=="string")?doc.accounts.split("\n"):doc.accounts;
			doc.sending_status = [];
			for(let i=0;i<doc.sending.length;i++){
				doc.sending_status.push(0);
			}
			doc.accounts = (typeof doc.accounts=="string")?doc.accounts:doc.accounts.join("\n");
			if(doc.options){
				for(let i=0;i<doc.options.length;i++){
					doc.options[i] = {text: doc.options[i]};
				}	
			}
		}
		return doc;
	},
	beforeRead: function(){
		this.reading = true;
		return true;
	},
	afterRead: function(){
		this.reading = false;
		CKEDITOR.instances["poll_input_content"].setData(this.doc.content);
		$("#poll_modal_list").modal("hide");
		$("#poll_modal_form").modal("show");
		this.parent.refreshView();
	},
	formatToServer: function(doc){
		delete doc.sending;
		delete doc.sending_status;
		doc.content = CKEDITOR.instances["poll_input_content"].getData();
		doc.accounts = (doc.accounts)?doc.accounts.split("\n"):"";
		if(doc.options){
			for(let i=0;i<doc.options.length;i++){
				doc.options[i] = doc.options[i].text;
			}	
		}
		this.status_sender = (doc.status=="Enviada")?doc._id:null;
		return doc;
	},
	beforeCreate: function(){
		return confirm("confirme creación del documento");
	},
	afterCreate: function(){
		$('#poll_modal_form').modal('hide');
		if(this.status_sender!=null){
			this.start_plebiscite(this.status_sender);
		}else{
			this.started = false;
			this.open();
		}
	},
	beforeUpdate: function(){
		return confirm("confirme actualización del documento");
	},
	paramsToUpdate: function(){
		return {id: this.doc._id};
	},
	afterUpdate: function(){
		$('#poll_modal_form').modal('hide');
		if(this.status_sender!=null){
			this.start_plebiscite(this.status_sender);
		}else{
			this.started = false;
			this.open();
		}
	},
	beforeDelete: function(){
		return confirm("confirme eliminación del documento");
	},
	paramsToDelete: function(){
		return {id: this.doc._id};
	},
	afterDelete: function(){
		$('#poll_modal_form').modal('hide');
		this.started = false;
		this.open();
	},
	selectRoles: async function(id){
		$('.loader').fadeIn();
		
		const u = await this.service_users({id: id});
		
		u.filter((r)=>{
			return !this.users[r.email];
		}).map((r)=>{
			this.users[r.email] = r;
		});
		
		this.getDoc().accounts += ((this.getDoc().accounts=='')?'':'\n') + u.map((r)=>{return r.email}).join('\n');
		this.parent.refreshView();
		$('.loader').fadeOut();
	},
	start_plebiscite: async function(id){
		try{
			$('.loader').fadeIn();
			await this.service_start({id: id});
		}catch(e){
			alert("Error al iniciar encuesta: " + e.toString());
			console.log(e);
		}
		$('.loader').fadeOut();
		$('#poll_modal_sending').modal('hide');
		this.started = false;
		this.open();
	},
	notifyAll: function(){
		for(let i=0;i<this.doc.sending.length;i++){
			this.notify(this.doc._id,this.doc.sending[i],i);
		}
	},
	notify: async function(id,to,index){
		try{
			this.doc.sending_status[index] = 1;
			await this.service_notify({id: id, to: to.trim()});
			this.doc.sending_status[index] = 2;
		}catch(e){
			this.doc.sending_status[index] = 3;
		}
		this.parent.refreshView();
	},
	getSendingStatus: function(index){
		return this.doc.sending_status[index];
	},
	
	answer: function(data){
		$("#poll_modal_answer .poll-content").html(data.poll.content);
		$("#poll_modal_answer form").attr('action',data.action);
		$('#poll_modal_answer').modal('show');
		this.answer_document = data.poll;
		this.parent.refreshView();
	},
	
	result: function(doc){
		$("#poll_modal_result .poll-content").html((doc)?doc.content:this.getDoc().content);
		const row = doc || this.getDoc();
		console.log(row);
		
		$('#poll_modal_form').modal('hide');
		$('#poll_modal_result').modal('show');
		
		
		
		const counter = function(option){
			return row.answer.filter(function(r){
				return r == option;
			}).length;
		}
		
		//set counters
		counters = {};
		if(row.answer){
			for(let i=0;i<row.answer.length;i++){
				if(!counters[row.answer[i]]){
					counters[row.answer[i]] = counter(row.answer[i]);
				}
			}
		}
		
		
		//set counters from anon
		if(row.anon){
			for(let i=0;i<row.anons.length;i++){
				if(counters[row.anons[i]]){
					counters[row.anons[i]]++;
				}else{
					counters[row.anons[i]] = 1;
				}
			}
		}
		
		const dataPoints = [];
		for(op in counters){
			dataPoints.push({
				label: (op=="null")?"No respondida":op,
				y: counters[op]
			});
		}
		
		
		const chart = new CanvasJS.Chart("poll_chart_container", {
			animationEnabled: true,
			title: {
				text: "Resultados"
			},
			data: [{
				type: "pie",
				dataPoints: dataPoints
			}]
		});
		chart.render();
			
	}
});