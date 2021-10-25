"use strict";

const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');

const self = function(){
	
}



//@route('/wall')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let data = await mongodb.find("wall",{},{limit: 10, sort: {created: -1}});
		res.render("wall/collection",{title: "Muro", rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("index",helper.toRenderError(req,e));
	}
}



//@route('/wall/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let data = await mongodb.find("wall",{tag: req.params.id},{limit: 10, sort: {created: -1}});
		res.render("wall/collection",{title: req.params.id.charAt(0).toUpperCase() + req.params.id.slice(1),rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("index",helper.toRenderError(req,e));
	}
}



//@route('/api/wall/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await mongodb.count("wall",query);
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
		let data = await mongodb.find("wall",query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/wall/tag/collection')
//@method(['get'])
self.prototype.tags = async function(req,res){
	try{
		let data = await mongodb.distinct("wall","tag");
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
		await mongodb.insertOne("wall",req.body);
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
		let row = await mongodb.findOne("wall",req.params.id);
		await mongodb.deleteOne("wall",req.params.id);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = new self();