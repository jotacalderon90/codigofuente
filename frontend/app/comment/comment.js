app.modules.comment = new trascender({
	properties: {
		name: "comment", 
		label: "Comentarios", 
		icon: "fa-file-text"
	},
	showApp: function(){
		return false;
	},
	increase: true,
	baseurl: "api/comment",
	default: function(){
		return {comment: ""};
	},
	onload: function(){
		this.service_user = this.serviceCreate("GET","/api/account/:id");
		this.users = {};
		this.users['anonymous'] = {nickname: "Anónimo", thumb: "/assets/media/img/user.png"};
		this.usersToLoad = [];
		this.new();
	},
	load: function(id){
		this.obtained = 0;
		this.cant = 0;
		this.coll = [];
		this.query = {parent: id};//20210203:no se busca por objeto porque aun no es un problema, si se presentase el camino depende
		this.options.sort = {created: -1};
		this.getTotal();
		$('#comment_modal_main').modal('show');
	},
	afterGetTotal: function(){
		this.parent.refreshView();
	},
	beforeGetCollection: function(){
		$(".loader").fadeIn();
		return true;
	},
	afterGetCollection: async function(){
		console.log(this.usersToLoad);
		for(let i=0;i<this.usersToLoad.length;i++){
			//if(this.canShowUser()){
				this.users[this.usersToLoad[i]] = await this.service_user({id: this.usersToLoad[i]});
			//}else{
			//	this.users[this.usersToLoad[i]] = this.users['anonymous'];
			//}
		}
		this.parent.refreshView();
		$(".loader").fadeOut();
	},
	formatToClient: function(doc){
		if(!doc.anonymous && !this.users[doc.author] && this.usersToLoad.indexOf(doc.author)==-1){
			this.usersToLoad.push(doc.author);
		}
		if(doc.anonymous){
			doc.author = 'anonymous';
		}
		doc.datefromnow = moment(new Date(doc.created), "YYYYMMDD, h:mm:ss").fromNow();
		doc.datetitle = moment(new Date(doc.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
		return doc;
	},
	formatToServer: function(doc){
		doc.parent = this.query.parent;
		return doc;
	},
	beforeCreate: function(doc){
		if(doc.comment.trim().length > 500){
			alert('Intente con un mensaje más corto');
			return;
		}
		if(doc.comment.trim()!=''){
			return confirm('Confirme su comentario');
		}
		return;
	}, 
	afterCreate: function(){
		this.new();
		this.coll = [];
		this.obtained = 0;
		this.getTotal();
	}/*,
	canShowUser: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole('user');
	},
	canComment: function(){
		return this.hasRole('root') || this.hasRole('admin') || this.hasRole('user');
	}*/
});