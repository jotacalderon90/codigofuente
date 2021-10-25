"use strict";

const fs = require('fs');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');
const logger = require('./lib/log')('route.blog');

const object = 'blog';
const img_front_path = '/assets/media/img/' + object + '/';
const img_back_path = config.dir + '/frontend';

if (!fs.existsSync(img_back_path + img_front_path)) {
	fs.mkdirSync(img_back_path + img_front_path);
}

const forTag = function(role,tag){
	let r = [];
	for(let i=0;i<tag.length;i++){
		if(typeof tag[i]==='string'){
			r.push(tag[i]);
		}else if(typeof tag[i]==='object' && (!tag[i].roles || tag[i].roles.indexOf(role) > -1)){
			r.push(tag[i].label);
			if(tag[i].tag){
				r = r.concat(forTag(role,tag[i].tag));
			}
		}
	}
	return r;
}

const self = function(a){
	this.start();
}

self.prototype.start = async function(){
	try{
		this.setting = await mongodb.find("setting",{type: object},{limit: 1});
		if(this.setting.length==1){
			this.setting = this.setting[0];
		}else{
			this.setting = await mongodb.insertOne("setting",{type: object});
			this.setting = this.setting.ops[0];
		}
		this.setTagsByRole();
	}catch(e){
		console.log('ERROR:' + object + ':START');
		console.log(e);
	}
}

self.prototype.setTagsByRole = function(){
	if(this.setting.roles && this.setting.tag){
		this.setting.roles_tag = {};
		let tags;
		for(let i=0;i<this.setting.roles.length;i++){
			this.setting.roles_tag[this.setting.roles[i]] = forTag(this.setting.roles[i],this.setting.tag);
		}
	}
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
		const row = await mongodb.findOne(object,req.params.id);
		if(row.author._id != req.user._id){
			throw('invalid user!');
		}
	}
	return true;
}

self.prototype.paramsToRender = function(req,action,data){
	return {...helper.toRender(req), onOpen: {app: object, action: action, data: data}};
}

/*******/
/*VIEWS*/
/*******/

/*render blog collection
//@route('/blog')
//@method(['get'])
*/
self.prototype.renderCollection = async function(req,res){
	helper.render(req,res,'index',{app: 'blog', action: 'open'});
}

/*render blog tag x
//@route('/blog/categoria/:id')
//@method(['get'])
*/
self.prototype.renderCollectionTag = async function(req,res){
	helper.render(req,res,'index',{app: 'blog', action: 'getByTag2', data: req.params.id});
}

/*render blog new
//@route('/blog/new')
//@method(['get'])
*/
self.prototype.new = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
		helper.render(req,res,'index',{app: 'blog', action: 'newByServer'});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*render blog document
//@route('/blog/:id')
//@method(['get'])
*/
self.prototype.renderDocument = async function(req,res){
	try{	
		const data = await mongodb.find(object,{uri:req.params.id});
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}else{
			res.render("index",{
				title: data[0].title,
				description: data[0].resume, 
				keywords: object + ',' + data[0].tag.join(','),
				author: data[0].author,
				img: data[0].img,
				...this.paramsToRender(req,'openRow',data[0])
			});
		}
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*render blog edit
//@route('/blog/edit/:id')
//@method(['get'])
*/
self.prototype.edit = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin','blog'])){throw(401);}
		
		const row = await mongodb.findOne(object,req.params.id);
		res.render("index",this.paramsToRender(req,'editByServer',row));	
	}catch(e){
		helper.onError(req,res,e);
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
		const total = await mongodb.count(object,req.query);
		res.send({data: total});
	}catch(e){
		helper.onError(req,res,e);
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
		const data = await mongodb.find(object,req.query,req.options);
		res.send({data: data});
	}catch(e){
		helper.onError(req,res,e);
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
			const data = await mongodb.distinct(object,"tag");
			res.send({data: data});
		}
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*service create
//@route('/api/blog')
//@method(['post'])
*/
self.prototype.create = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		logger.request(helper.reqToLog(req));
		if(req.user==null || !helper.hasRole(req,['root','admin','blog'])){throw(401);}
		
		req.body.author = helper.saveUser(req.user);
		req.body.created = new Date();
		req.body.img = "/assets/media/img/logo.png";
		req.body.thumb = "/assets/media/img/logo.png";
		
		await mongodb.insertOne(object,req.body);
		
		res.send({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*service read
//@route('/api/blog/:id')
//@method(['get'])
*/
self.prototype.read = async function(req,res){
	try{
		const row = await mongodb.findOne(object,req.params.id);
		res.send({data: row});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*service update
//@route('/api/blog/:id')
//@method(['put'])
*/
self.prototype.update = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		logger.request(helper.reqToLog(req));
		if(req.user==null || !helper.hasRole(req,['root','admin','blog'])){throw(401);}
	
		await this.canExecute(req);
		
		req.body.updated = new Date();
		
		await mongodb.updateOne(object,req.params.id,req.body);
		
		res.send({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*service delete
//@route('/api/blog/:id')
//@method(['delete'])
*/
self.prototype.delete = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		logger.request(helper.reqToLog(req));
		if(req.user==null || !helper.hasRole(req,['root','admin','blog'])){throw(401);}
	
		await this.canExecute(req);
		const row = await mongodb.findOne(object,req.params.id);
		await mongodb.deleteOne(object,req.params.id);
		res.send({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/***********/
/*API:ADMIN*/
/***********/

/*service upload image
//@route('/api/blog/:id/image')
//@method(['post'])
*/
self.prototype.upload = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		logger.request(helper.reqToLog(req));
		if(req.user==null || !helper.hasRole(req,['root','admin','blog'])){throw(401);}
	
		if (!req.files || Object.keys(req.files).length != 1) {
			throw("no file");
		}
		await this.canExecute(req);
		const d = img_front_path + req.params.id + ".jpg";
		await helper.upload_process(req.files.file, img_front_path + d);
		await mongodb.updateOne(object,req.params.id,{$set: {img: d, thumb: d}});
		res.redirect("/" + object + "/edit/" + req.params.id);
	}catch(e){
		helper.onError(req,res,e);
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
		helper.onError(req,res,e);
	}
}

/*service to setting blog
//@route('/api/blog/admin/setting')
//@method(['put'])
*/
self.prototype.put_setting = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		logger.request(helper.reqToLog(req));
		if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
	
		req.body.type = object;
		await mongodb.updateOne("setting",this.setting._id,req.body);
		await this.start();
		res.send({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}



module.exports = new self();