"use strict";

const fs = require('fs');

const logger = require('./lib/log')('route.blog');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');

const object = 'blog';
const img_front_path = '/assets/media/img/' + object + '/';
const img_back_path = config.dir + '/frontend';

let setting;

if (!fs.existsSync(img_back_path + img_front_path)) {
	fs.mkdirSync(img_back_path + img_front_path);
}

const start = async function(){
	try{
		setting = await mongodb.find("setting",{type: object},{limit: 1});
		if(setting.length==1){
			setting = setting[0];
		}else{
			setting = await mongodb.insertOne("setting",{type: object});
			setting = setting.ops[0];
		}
		setTagsByRole();
	}catch(e){
		logger.info(e);
	}
}

const setTagsByRole = function(){
	if(setting.roles && setting.tag){
		setting.roles_tag = {};
		let tags;
		for(let i=0;i<setting.roles.length;i++){
			setting.roles_tag[setting.roles[i]] = forTag(setting.roles[i],setting.tag);
		}
	}
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

const getUserRole = function(req){
	return ((req.user && req.user.roles && req.user.roles.length > 0)?req.user.roles[0]:'anonymous');
}

const getTagsEnabledByUserRole = function(req){
	if(!setting.active || !setting.roles_tag){
		return req.query.tag;
	}
	const userRole = setting.roles_tag[getUserRole(req)];
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

const canExecute = async function(req){
	if(req.user.roles.indexOf('root')==-1 && req.user.roles.indexOf('admin')==-1){
		const row = await mongodb.findOne(object,req.params.id);
		if(row.author._id != req.user._id){
			throw('invalid user!');
		}
	}
	return true;
}

const canShowInactive = function(req){
	try{
		if (req.user.roles.indexOf('root') > -1 || req.user.roles.indexOf('admin') > -1 || req.user.roles.indexOf('product') > -1){
			return true;
		}else{
			return false;
		}
	}catch(e){
		return false;
	}
}

const paramsToRender = async function(req,action,data){
	return {...await helper.toRender(req), onOpen: {app: object, action: action, data: data}};
}

start();

module.exports = {
	renderCollection: async function(req,res){
		helper.render(req,res,'index',{app: object, action: 'open'});
	},
	renderCollectionTag: async function(req,res){
		helper.render(req,res,'index',{app: object, action: 'getByTag2', data: req.params.id});
	},
	new: async function(req,res){
		try{
			logger.request(helper.reqToLog(req));
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root','admin',object])){throw(401);}
			helper.render(req,res,'index',{app: object, action: 'newByServer'});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	renderDocument: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			const data = await mongodb.find(object,{uri:req.params.id});
			if(data.length!=1){
				throw("No se encontró el documento solicitado");
			}else{
				res.render("index",{
					title: data[0].title,
					description: data[0].resume, 
					keywords: object + ',' + data[0].tag.join(','),
					author: data[0].author.nickname,
					img: data[0].img,
					...await paramsToRender(req,'openRow',data[0])
				});
			}
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	edit: async function(req,res){
		try{
			logger.request(helper.reqToLog(req));
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root','admin',object])){throw(401);}
			
			const row = await mongodb.findOne(object,req.params.id);
			res.render("index",await paramsToRender(req,'editByServer',row));	
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	total: async function(req,res){
		try{
			req.query = (req.query.query)?JSON.parse(req.query.query):{};
			req.query.tag = getTagsEnabledByUserRole(req);
			if(req.query.tag===undefined){delete req.query.tag;}
			if(!canShowInactive(req)){
				req.query.active = true;
			}
			const total = await mongodb.count(object,req.query);
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.options = (req.query.options)?JSON.parse(req.query.options):{};
			req.query = (req.query.query)?JSON.parse(req.query.query):{};
			req.query.tag = getTagsEnabledByUserRole(req);
			if(req.query.tag===undefined){delete req.query.tag;}
			if(!canShowInactive(req)){
				req.query.active = true;
			}
			const data = await mongodb.find(object,req.query,req.options);
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	tag: async function(req,res){
		try{
			if(setting.active){
				res.send({data: setting.roles_tag[getUserRole(req)]});
			}else{
				const data = await mongodb.distinct(object,"tag");
				res.send({data: data});
			}
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin',object])){throw(401);}
			
			req.body.author = helper.saveUser(req.user);
			req.body.created = new Date();
			req.body.img = "/assets/media/img/logo.png";
			req.body.thumb = "/assets/media/img/logo.png";
			
			await mongodb.insertOne(object,req.body);
			
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	read: async function(req,res){
		try{
			const row = await mongodb.findOne(object,req.params.id);
			res.send({data: row});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin',object])){throw(401);}
		
			await canExecute(req);
			
			req.body.updated = new Date();
			
			await mongodb.updateOne(object,req.params.id,req.body);
			
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin',object])){throw(401);}
		
			await canExecute(req);
			const row = await mongodb.findOne(object,req.params.id);
			await mongodb.deleteOne(object,req.params.id);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	upload: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin',object])){throw(401);}
			
			if (!req.files || Object.keys(req.files).length != 1) {
				throw("no file");
			}
			await canExecute(req);
			const d = img_front_path + req.params.id + ".jpg";
			await helper.upload_process(req.files.file, img_back_path + d);
			await mongodb.updateOne(object,req.params.id,{$set: {img: d, thumb: d}});
			res.redirect("/" + object + "/edit/" + req.params.id);
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	get_setting: async function(req,res){
		try{
			const userRole = getUserRole(req);
			
			if(userRole=='root'){
				res.send({data: setting});
				return;
			}
			
			if(!setting.active){
				res.send({data: {
					active: setting.active,
					type: setting.type
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
			ur[userRole] = setting.roles_tag[userRole];
			
			res.send({data: {
				active: setting.active,
				type: setting.type,
				roles: setting.roles.filter((r)=>{return r === userRole}),
				tag: getTags(setting.tag),
				roles_tag: ur
			}});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	put_setting: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			req.body.type = object;
			await mongodb.updateOne("setting",setting._id,req.body);
			await start();
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}

};