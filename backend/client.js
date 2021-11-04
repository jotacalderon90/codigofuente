"use strict";

const logger = require('./lib/log')('route.client');
const helper = require('./lib/helper');
const geoip = require("geoip-lite");

module.exports = {
	ip: async function(req,res){
		try{
			logger.request(helper.reqToLog(req));
			res.send({data: helper.getRealIP(req)});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	geoip: async function(req,res){
		try{
			logger.request(helper.reqToLog(req));
			res.send({data: geoip.lookup(helper.getRealIP(req))});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	geoipFromIP: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			logger.request(helper.reqToLog(req));
			res.send({data: geoip.lookup(req.params.ip)});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}