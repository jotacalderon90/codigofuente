"use strict";

const fs = require("fs");

const logger = require('./lib/log')('route.users');
const helper = require('./lib/helper');
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const render = require('./lib/render');

module.exports = {
	total: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			query.roles = {$nin:['root']};
			const total = await mongodb.count('user',query);
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			query.roles = {$nin:['root']};
			const options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
			options.projection = {email: 1,activate: 1, roles: 1};
			const data = await mongodb.find('user',query,options);
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	tags: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const data = await mongodb.distinct('user',"tag");
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			req.body.email = req.body.email.toLowerCase();
			if(!helper.isEmail(req.body.email)){
				throw("El email ingresado no es válido");
			}
			if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
				throw("La contraseña ingresada debe tener al menos 5 caracteres");
			}
			let ce = await mongodb.count("user",{email: req.body.email});
			if(ce!=0){
				throw("El email ingresado ya está registrado");
			}
			let doc = {};
			doc.email = req.body.email;
			doc.hash = helper.random(10);
			doc.password = helper.toHash(req.body.password + req.body.email,doc.hash);
			doc.nickname = req.body.email;
			doc.notification = true;
			doc.thumb = "/assets/media/img/user.png";
			doc.roles = ["user"];
			doc.created = new Date();
			doc.activate = true;
			await mongodb.insertOne("user",doc);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const row = await mongodb.findOne('user',req.params.id);
			switch(req.body.type){
				case 'activate':
					await mongodb.updateOne('user',req.params.id,{$set: {activate: (row.activate)?false:true}});
				break;
				case 'password':
					if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
						throw("La contraseña ingresada debe tener al menos 5 caracteres");
					}
					await mongodb.updateOne('user',req.params.id,{$set: {password: helper.toHash(req.body.password + row.email,row.hash)}});
				break;
				case 'notify':
					const memo = {};
					memo.to = row.email;
					memo.bcc = config.properties.admin;
					memo.subject = "Reestablecer contraseña";
					memo.hash = config.properties.host + "/account/recovery?hash=" + new Buffer(row.password).toString("base64");
					memo.html = render.process("account/memo.recovery.html", memo);
					await mailing.send(memo);
				break;
				case 'roles':
					if(req.body.roles.length==0){ 
						throw("Debe asignar al menos un rol");
					}
					await mongodb.updateOne('user',req.params.id,{$set: {roles: req.body.roles}});
				break;
			}
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			await mongodb.deleteOne('user',req.params.id);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}