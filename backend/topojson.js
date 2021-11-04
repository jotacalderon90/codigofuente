"use strict";

const logger = require('./lib/log')('route.topojson');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');

module.exports = {
	total: async function(req,res){
		try{
			const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			res.send({data: await this.mongodb.count('topojson',query)});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			const options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
			res.send({data: await this.mongodb.find('topojson',query,options)});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	read: async function(req,res){
		try{
			res.send({data: await this.mongodb.findOne('topojson',req.params.id)});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}