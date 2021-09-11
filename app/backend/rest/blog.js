"use strict";

const fs = require('fs');

const self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.mongodb = a.mongodb;
	this.helper = a.helper;
	this.microservice = a.microservice;
	this.object = 'blog';
	this.img_front_path = '/assets/media/img/' + this.object + '/';
	this.img_back_path = this.dir + '/app/frontend';
	if (!fs.existsSync(this.img_back_path + this.img_front_path)) {
		fs.mkdirSync(this.img_back_path + this.img_front_path);
	}
	this.start();
	this.patch();
}

self.prototype.start = async function(){
	try{
		this.setting = await this.mongodb.find("setting",{type: this.object},{limit: 1});
		if(this.setting.length==1){
			this.setting = this.setting[0];
		}else{
			this.setting = await this.mongodb.insertOne("setting",{type: this.object});
			this.setting = this.setting.ops[0];
		}
		this.setTagsByRole();
	}catch(e){
		console.log('ERROR:' + this.object + ':START');
		console.log(e);
	}
}

self.prototype.patch = async function(){
	//20210614:actualiza registro campo autor con objeto completo del admin
	try{
		//const u = await this.mongodb.find('user',{roles: {$in: ['admin']}});
		//const d = await this.mongodb.updateMany(this.object,{},{$set: {author: this.helper.saveUser(u[0])}});
	}catch(e){
		console.log(e);
	}
}

self.prototype.setTagsByRole = function(){
	if(this.setting.roles && this.setting.tag){
		this.setting.roles_tag = {};
		let tags;
		for(let i=0;i<this.setting.roles.length;i++){
			this.setting.roles_tag[this.setting.roles[i]] = this.forTag(this.setting.roles[i],this.setting.tag);
		}
	}
}

self.prototype.forTag = function(role,tag){
	let r = [];
	for(let i=0;i<tag.length;i++){
		if(typeof tag[i]==='string'){
			r.push(tag[i]);
		}else if(typeof tag[i]==='object' && (!tag[i].roles || tag[i].roles.indexOf(role) > -1)){
			r.push(tag[i].label);
			if(tag[i].tag){
				r = r.concat(this.forTag(role,tag[i].tag));
			}
		}
	}
	return r;
}

self.prototype.distinct = function(array){
	let a = [];
	for(let i=0;i<array.length;i++){
		if(a.indexOf(array[i])==-1){
			a.push(array[i]);
		}
	}
	return a;
}

self.prototype.getUserRole = function(req){
	return ((req.user && req.user.roles && req.user.roles.length > 0)?req.user.roles[0]:'anonymous');
}

self.prototype.getTagsEnabledByUserRole = function(req){
	if(!this.setting.active || !this.setting.roles_tag){
		return req.query.tag;
	}
	const userRole = this.setting.roles_tag[this.getUserRole(req)];
	if(req.query.tag && typeof req.query.tag==='string' && userRole.length > 0 && userRole.indexOf(req.query.tag) > -1){
		return req.query.tag;
	}else if(req.query.tag && req.query.tag['$in']){
		return {$in: req.query.tag['$in'].filter((r)=>{
			return userRole.indexOf(r)>-1;
		})};
	}else{
		return {$in: userRole};
	}
}

self.prototype.canExecute = async function(req){
	if(req.user.roles.indexOf('root')==-1 && req.user.roles.indexOf('admin')==-1){
		const row = await this.mongodb.findOne(this.object,req.params.id);
		if(row.author._id != req.user._id){
			throw('invalid user!');
		}
	}
	return true;
}

self.prototype.paramsToRender = function(req,action,data){
	return {...this.helper.toRender(req), onOpen: {app: this.object, action: action, data: data}};
}

/*******/
/*VIEWS*/
/*******/

/*render blog collection
//@route('/blog')
//@method(['get'])
*/
self.prototype.renderCollection = async function(req,res){
	try{
		res.render("index",this.paramsToRender(req,'open',null));
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*render blog tag x
//@route('/blog/categoria/:id')
//@method(['get'])
*/
self.prototype.renderCollectionTag = async function(req,res){
	try{
		res.render("index",this.paramsToRender(req,'getByTag2',req.params.id));
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*render blog new
//@route('/blog/new')
//@method(['get'])
//@roles(['root','admin','blog'])
*/
self.prototype.new = async function(req,res){
	res.render("index",this.paramsToRender(req,'newByServer'));
}

/*render blog document
//@route('/blog/:id')
//@method(['get'])
*/
self.prototype.renderDocument = async function(req,res){
	try{	
		let data = await this.mongodb.find(this.object,{uri:req.params.id});
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}else{
			res.render("index",{
				title: data[0].title,
				description: data[0].resume, 
				keywords: this.object + ',' + data[0].tag.join(','),
				author: data[0].author,
				img: data[0].img,
				...this.paramsToRender(req,'openRow',data[0])
			});
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*render blog edit
//@route('/blog/edit/:id')
//@method(['get'])
//@roles(['root','admin','blog'])
*/
self.prototype.edit = async function(req,res){
	try{	
		const row = await this.mongodb.findOne(this.object,req.params.id);
		res.render("index",this.paramsToRender(req,'editByServer',row));
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*****/
/*API*/
/*****/

/*service total
//@route('/api/blog/total')
//@method(['get'])
*/
self.prototype.total = async function(req,res){
	try{
		req.query = (req.query.query)?JSON.parse(req.query.query):{};
		req.query.tag = this.getTagsEnabledByUserRole(req);
		if(req.query.tag===undefined){delete req.query.tag;}
		const total = await this.mongodb.count(this.object,req.query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service collection
//@route('/api/blog/collection')
//@method(['get'])
*/
self.prototype.collection = async function(req,res){
	try{
		req.options = (req.query.options)?JSON.parse(req.query.options):{};
		req.query = (req.query.query)?JSON.parse(req.query.query):{};
		req.query.tag = this.getTagsEnabledByUserRole(req);
		if(req.query.tag===undefined){delete req.query.tag;}
		const data = await this.mongodb.find(this.object,req.query,req.options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service tags
//@route('/api/blog/tag/collection')
//@method(['get'])
*/
self.prototype.tag = async function(req,res){
	try{
		if(this.setting.active){
			res.send({data: this.setting.roles_tag[this.getUserRole(req)]});
		}else{
			const data = await this.mongodb.distinct(this.object,"tag");
			res.send({data: data});
		}
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service create
//@route('/api/blog')
//@method(['post'])
//@roles(['root','admin','blog'])
*/
self.prototype.create = async function(req,res){
	try{
		req.body.author = this.helper.saveUser(req.user);
		req.body.created = new Date();
		req.body.img = "/assets/media/img/logo.png";
		req.body.thumb = "/assets/media/img/logo.png";
		
		await this.mongodb.insertOne(this.object,req.body);
		
		this.microservice.noWait("post","/api/wall",{
			content: "<p>Creó una nuevo registro en " + this.object + ": <small>" + req.body.title + "</small></p>",
			url: "/" + this.object + "/" + req.body.uri,
			tag: req.body.tag
		});
		
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service read
//@route('/api/blog/:id')
//@method(['get'])
*/
self.prototype.read = async function(req,res){
	try{
		const row = await this.mongodb.findOne(this.object,req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service update
//@route('/api/blog/:id')
//@method(['put'])
//@roles(['root','admin','blog'])
*/
self.prototype.update = async function(req,res){
	try{
		await this.canExecute(req);
		
		req.body.updated = new Date();
		
		await this.mongodb.updateOne(this.object,req.params.id,req.body);
		
		this.microservice.noWait("post","/api/wall",{
			content: "<p>Actualizó un registro en " + this.object + ": <small>" + req.body.title + "</small></p>",
			url: "/" + this.object + "/" + req.body.uri,
			tag: req.body.tag
		});
		
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service delete
//@route('/api/blog/:id')
//@method(['delete'])
//@roles(['root','admin','blog'])
*/
self.prototype.delete = async function(req,res){
	try{
		await this.canExecute(req);
		const row = await this.mongodb.findOne(this.object,req.params.id);
		await this.mongodb.deleteOne(this.object,req.params.id);
		this.microservice.noWait("post","/api/wall",{
			content: "<p>Eliminó un registro en " + this.object + ": <small>" + req.params.id + "</small></p>",
			tag: [this.object]
		});
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/***********/
/*API:ADMIN*/
/***********/

/*service upload image
//@route('/api/blog/:id/image')
//@method(['post'])
//@roles(['root','admin','blog'])
*/
self.prototype.upload = async function(req,res){
	try{
		if (!req.files || Object.keys(req.files).length != 1) {
			throw("no file");
		}
		await this.canExecute(req);
		const d = this.img_front_path + req.params.id + ".jpg";
		await this.helper.upload_process(req.files.file, this.img_back_path + d);
		await this.mongodb.updateOne(this.object,req.params.id,{$set: {img: d, thumb: d}});
		res.redirect("/" + this.object + "/edit/" + req.params.id);
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*************/
/*API:SETTING*/
/*************/

/*service to get setting blog
//@route('/api/blog/admin/setting')
//@method(['get'])
*/
self.prototype.get_setting = async function(req,res){
	try{
		const userRole = this.getUserRole(req);
		
		if(userRole=='root'){
			res.send({data: this.setting});
			return;
		}
		
		if(!this.setting.active){
			res.send({data: {
				active: this.setting.active,
				type: this.setting.type
			}});
			return;
		}
		
		const getTags = function(tags){		
			const tag = [];
			for(let i=0;i<tags.length;i++){
				const insert = (typeof tags[i]=='string' || !tags[i].roles || (tags[i].roles && tags[i].roles.indexOf(userRole)>0))?true:false;
				if(insert){
					if(tags[i].tag){
						tags[i].tag = getTags(tags[i].tag);
					}					
					tag.push(tags[i]);
				}
			}
			return tag;
		}
		
		const ur = {};
		ur[userRole] = this.setting.roles_tag[userRole];
		
		res.send({data: {
			active: this.setting.active,
			type: this.setting.type,
			roles: this.setting.roles.filter((r)=>{return r === userRole}),
			tag: getTags(this.setting.tag),
			roles_tag: ur
		}});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*service to setting blog
//@route('/api/blog/admin/setting')
//@method(['put'])
//@roles(['root'])
*/
self.prototype.put_setting = async function(req,res){
	try{
		req.body.type = this.object;
		await this.mongodb.updateOne("setting",this.setting._id,req.body);
		await this.start();
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



module.exports = self;