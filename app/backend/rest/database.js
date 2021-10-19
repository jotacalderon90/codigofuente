"use strict";

const fs = require("fs");

const self = function(a){
	this.dir = a.dir;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
}

/*export data by name params
//@route('/api/document/:name/export')
//@method(['get'])
*/
self.prototype.export = async function(req,res){
	try{
		let o = await this.mongodb.find("object",{name: req.params.name});
		if(o.length!=1){
			throw("Problemas con el objeto");
		}
		if(!o[0].public){
			throw("Problemas con el objeto (2)");
		}
		if(o[0].role && req.user.roles.indexOf(o[0].role)==-1){
			throw("Problemas con el objeto (3)");
		}
		let data = await this.mongodb.find(req.params.name);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*import data by name params
//@route('/api/document/:name/import')
//@method(['post'])
//@roles(['root'])
*/
self.prototype.import = async function(req,res){
	try{
		let request = await this.helper.request(req.body.uri);
		if(!request.data){
			throw(request.error);
		}
		
		for(let i=0;i<request.data.length;i++){
			request.data[i]._id = this.mongodb.toId(request.data[i]._id);
			await this.mongodb.insertOne(req.params.name,request.data[i]);
			console.log("INSERTADO " + (i+1) + "/" + request.data.length);
		}
		
		res.send({data: req.body.uri});
	}catch(e){
		console.log(e);
		res.send({data: null,error: e.toString()});
	}
}

/*get total of collection
//@route('/api/document/:name/total')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.total = async function(req,res){
	try{
		let collection = req.params.name;
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(collection,query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*get documents of collection
//@route('/api/document/:name/collection')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.collection = async function(req,res){
	try{
		let collection = req.params.name;
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(collection,query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*get tags of collection by distinct tag field
//@route('/api/document/:name/tags')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.tags = async function(req,res){
	try{
		let collection = req.params.name;
		let data = await this.mongodb.distinct(collection,"tag");
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*create object in collection
//@route('/api/document/:name')
//@method(['post'])
//@roles(['root'])
*/
self.prototype.create = async function(req,res){
	try{
		let collection = req.params.name;
		await this.mongodb.insertOne(collection,req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*read object by id and collection
//@route('/api/document/:name/:id')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.read = async function(req,res){
	try{
		let collection = req.params.name;
		let row = await this.mongodb.findOne(collection,req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*update object in collection
//@route('/api/document/:name/:id')
//@method(['put'])
//@roles(['root'])
*/
self.prototype.update = async function(req,res){
	try{
		let collection = req.params.name;
		await this.mongodb.updateOne(collection,req.params.id,req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*delete object in collection
//@route('/api/document/:name/:id')
//@method(['delete'])
//@roles(['root'])
*/
self.prototype.delete = async function(req,res){
	try{
		let collection = req.params.name;
		await this.mongodb.deleteOne(collection,req.params.id);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*render /database
//@route('/database')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.render_index = function(req,res){
	res.render("database/index");
}

module.exports = self;