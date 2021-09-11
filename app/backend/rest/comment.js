"use strict";

const self = function(a){
	this.mongodb = a.mongodb;
}

//@route('/api/comment/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		req.query = (req.query.query)?JSON.parse(req.query.query):{};
		const total = await this.mongodb.count('comment',req.query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/comment/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		req.options = (req.query.options)?JSON.parse(req.query.options):{};
		req.query = (req.query.query)?JSON.parse(req.query.query):{};
		const data = await this.mongodb.find('comment',req.query,req.options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/comment')
//@method(['post'])
//@roles(['root','admin','user'])
self.prototype.create = async function(req,res){
	try{
		if(!req.body.comment || typeof req.body.comment!='string' || req.body.comment.trim().length < 0 || req.body.comment.trim().length > 500){
			throw('error field comment');
		}
		req.body.author = (req.body.anonymous)?'anonymous':req.user._id;
		req.body.created = new Date();
		await this.mongodb.insertOne('comment',req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;