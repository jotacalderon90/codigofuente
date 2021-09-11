"use strict";

const fs = require("fs");
const path = require("path");

const self = function(a){
	this.dir = a.dir + "/app/frontend/";
}



self.prototype.decode = function(value){
	return decodeURIComponent(new Buffer(value,"base64"));
}



//@route('/api/file/frontend/:id')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.read = function(req,res){
	try{
		res.send({data: fs.readFileSync(this.dir + this.decode(req.params.id),"utf8")});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/frontend/:id')
//@method(['put'])
//@roles(['root','admin'])
self.prototype.update = function(req,res){
	try{
		fs.writeFileSync(this.dir + this.decode(req.params.id), req.body.content);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

module.exports = self;