"use strict";

const helper = require('./lib/helper');
const logger = require('./lib/log')('route.log');
const moment = require("moment");
const mongodb = require('./lib/mongodb');

module.exports = {
	total: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			const total = await mongodb.count('log', 
			{ 
				$and: [
					{date: {$gte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T00:00:00.000Z')}},
					{date: {$lte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T23:59:59.999Z')}}
				]
			});
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			const total = await mongodb.find('log', 
			{ 
				$and: [
					{date: {$gte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T00:00:00.000Z')}},
					{date: {$lte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T23:59:59.999Z')}}
				]
			},JSON.parse(req.query.options));
			
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	read: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			res.send({data: await mongodb.findOne('log',req.params.id)});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
};