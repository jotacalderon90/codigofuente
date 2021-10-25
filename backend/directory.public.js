"use strict";

const fs = require("fs");
const path = require("path");

const self = function(){
	this.dir = config.dir + "/frontend/";
}



self.prototype.decode = function(value){
	return decodeURIComponent(new Buffer(value,"base64"));
}



//@route('/api/file/frontend/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
		
		res.send({data: fs.readFileSync(this.dir + this.decode(req.params.id),"utf8")});
	}catch(e){
		helper.onError(req,res,e);
	}
}



//@route('/api/file/frontend/:id')
//@method(['put'])
self.prototype.update = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
		
		fs.writeFileSync(this.dir + this.decode(req.params.id), req.body.content);
		res.send({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

module.exports = new self();