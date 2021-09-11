"use strict";

let self = function(a,p){
	this.config = a.config;
	this.mongodb = a.mongodb;
}



//@route('/wall')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let data = await this.mongodb.find("wall",{},{limit: 10, sort: {created: -1}});
		res.render("wall/collection",{title: "Muro", rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/wall/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let data = await this.mongodb.find("wall",{tag: req.params.id},{limit: 10, sort: {created: -1}});
		res.render("wall/collection",{title: req.params.id.charAt(0).toUpperCase() + req.params.id.slice(1),rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/api/wall/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count("wall",query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/wall/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find("wall",query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/wall/tag/collection')
//@method(['get'])
self.prototype.tags = async function(req,res){
	try{
		let data = await this.mongodb.distinct("wall","tag");
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/wall')
//@method(['post'])
//@roles(['admin'])
self.prototype.create = async function(req,res){
	try{
		req.body.author = req.user._id;
		req.body.created = new Date();
		await this.mongodb.insertOne("wall",req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/wall/:id')
//@method(['delete'])
//@roles(['admin'])
self.prototype.delete = async function(req,res){
	try{
		let row = await this.mongodb.findOne("wall",req.params.id);
		await this.mongodb.deleteOne("wall",req.params.id);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



module.exports = self;