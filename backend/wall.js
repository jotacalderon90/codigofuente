"use strict";

const logger = require('./lib/log')('route.wall');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');

module.exports = {
	renderCollection: async function(req,res){
		try{
			const data = await mongodb.find("wall",{},{limit: 10, sort: {created: -1}});
			res.render("wall/collection",{title: "Muro", rows: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	renderCollectionTag: async function(req,res){
		try{
			let data = await mongodb.find("wall",{tag: req.params.id},{limit: 10, sort: {created: -1}});
			res.render("wall/collection",{title: req.params.id.charAt(0).toUpperCase() + req.params.id.slice(1),rows: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	total: async function(req,res){
		try{
			let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			let total = await mongodb.count("wall",query);
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
			let data = await mongodb.find("wall",query,options);
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	tags: async function(req,res){
		try{
			let data = await mongodb.distinct("wall","tag");
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
			
			req.body.author = req.user._id;
			req.body.created = new Date();
			await mongodb.insertOne("wall",req.body);
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
			
			let row = await mongodb.findOne("wall",req.params.id);
			await mongodb.deleteOne("wall",req.params.id);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
};