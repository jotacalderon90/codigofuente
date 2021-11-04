"use strict";

const fs = require("fs");
const path = require("path");

const logger = require('./lib/log')('route.directory_public');

const directory = config.dir + "/frontend/";

const decode = function(value){
	return decodeURIComponent(new Buffer(value,"base64"));
}

module.exports = {
	read: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			res.send({data: fs.readFileSync(directory + decode(req.params.id),"utf8")});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			fs.writeFileSync(directory + decode(req.params.id), req.body.content);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}

}