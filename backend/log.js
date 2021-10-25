"use strict";

const moment = require("moment");
const mongodb = require('./lib/mongodb');

const self = function(){
	this.object = 'log';
}

/*get total of collection
//@route('/api/log/total')
//@method(['get'])
//@roles(['root'])
*/
self.prototype.total = async function(req,res){
	try{
		const total = await mongodb.count(this.object, 
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
		const total = await mongodb.find(this.object, 
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
		let row = await mongodb.findOne(collection,req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = new self();