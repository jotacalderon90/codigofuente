"use strict";

const geoip = require("geoip-lite");

const self = function(application,params){
	
}



//@route('/api/client/ip')
//@method(['get'])
self.prototype.ip = async function(req,res){
	try{
		res.send({data: req.real_ip});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/client/geoip')
//@method(['get'])
self.prototype.geoip = function(req,res){
	try{
		const ip =  (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
		res.send({data: geoip.lookup(ip)});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/client/geoip/:ip')
//@method(['get'])
self.prototype.geoipFromIP = function(req,res){
	try{
		res.send({data: geoip.lookup(req.params.ip)});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

module.exports = self;