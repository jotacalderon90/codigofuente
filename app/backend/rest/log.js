"use strict";

const moment = require("moment");

const self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
	this.object = 'log';
}

/*get total of collection
//@route('/api/log/total')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.total = async function(req,res){
	try{
		const total = await this.mongodb.count(this.object, 
		{ 
			$and: [
				{date: {$gte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T00:00:00.000Z')}},
				{date: {$lte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T23:59:59.999Z')}}
			]
		});
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*get documents of collection
//@route('/api/log/collection')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.collection = async function(req,res){
	try{
		const total = await this.mongodb.find(this.object, 
		{ 
			$and: [
				{date: {$gte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T00:00:00.000Z')}},
				{date: {$lte: new Date(moment(req.query.date).format("YYYY-MM-DD") + 'T23:59:59.999Z')}}
			]
		},JSON.parse(req.query.options));
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*read object by id and collection
//@route('/api/log/:id')
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

module.exports = self;