"use strict";

const logger = require('./lib/log')('route.comment');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');

module.exports = {
	total: async function(req,res){
		try{
			req.query = (req.query.query)?JSON.parse(req.query.query):{};
			const total = await mongodb.count('comment',req.query);
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.options = (req.query.options)?JSON.parse(req.query.options):{};
			req.query = (req.query.query)?JSON.parse(req.query.query):{};
			const data = await mongodb.find('comment',req.query,req.options);
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
			
			if(!req.body.comment || typeof req.body.comment!='string' || req.body.comment.trim().length < 0 || req.body.comment.trim().length > 500){
				throw('error field comment');
			}
			req.body.author = (req.body.anonymous)?'anonymous':req.user._id;
			req.body.created = new Date();
			await mongodb.insertOne('comment',req.body);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}

};