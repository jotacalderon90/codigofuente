"use strict";

const geoip = require("geoip-lite");
const helper = require('./lib/helper');
const logger = require('./lib/log')('route.client');

const self = function(){
	
}

//@route('/api/client/ip')
//@method(['get'])
self.prototype.ip = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		res.send({data: helper.getRealIP(req)});
	}catch(e){
		helper.onError(req,res,e);
	}
}

//@route('/api/client/geoip')
//@method(['get'])
self.prototype.geoip = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		res.send({data: geoip.lookup(helper.getRealIP(req))});
	}catch(e){
		helper.onError(req,res,e);
	}
}

//@route('/api/client/geoip/:ip')
//@method(['get'])
self.prototype.geoipFromIP = async function(req,res){
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

module.exports = new self();