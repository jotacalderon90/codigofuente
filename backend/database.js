"use strict";

const fs = require("fs");

const logger = require('./lib/log')('route.database');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');

module.exports = {
	export: async function(req,res){
		try{
			let o = await mongodb.find("object",{name: req.params.name});
			if(o.length!=1){
				throw("Problemas con el objeto");
			}
			if(!o[0].public){
				throw("Problemas con el objeto (2)");
			}
			if(o[0].role && req.user.roles.indexOf(o[0].role)==-1){
				throw("Problemas con el objeto (3)");
			}
			let data = await mongodb.find(req.params.name);
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	import: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			const request = await helper.request(req.body.uri);
			if(!request.data){
				throw(request.error);
			}
			
			for(let i=0;i<request.data.length;i++){
				request.data[i]._id = mongodb.toId(request.data[i]._id);
				await mongodb.insertOne(req.params.name,request.data[i]);
				logger.info("INSERTADO " + (i+1) + "/" + request.data.length);
			}
			
			res.send({data: req.body.uri});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	total: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			res.send({data: await mongodb.count(req.params.name,query)});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			const options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
			res.send({data: await mongodb.find(req.params.name,query,options)});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	tags: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			res.send({data: await mongodb.distinct(req.params.name,"tag")});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			await mongodb.insertOne(req.params.name,req.body);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	read: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			res.send({data: await mongodb.findOne(req.params.name,req.params.id)});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			await mongodb.updateOne(req.params.name,req.params.id,req.body);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			await mongodb.deleteOne(req.params.name,req.params.id);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}