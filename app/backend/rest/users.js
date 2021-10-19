"use strict";

const fs = require("fs");

const self = function(a){
	this.dir = a.dir;
	this.mailing = a.mailing;
	this.render = a.render;
	this.mongodb = a.mongodb;
	this.helper = a.helper;
}

/*get total of users
//@route('/api/users/total')
//@method(['get'])
//@roles(['root','admin'])
*/
self.prototype.total = async function(req,res){
	try{
		const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		query.roles = {$nin:['root']};
		const total = await this.mongodb.count('user',query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*get documents of users
//@route('/api/users/collection')
//@method(['get'])
//@roles(['root','admin'])
*/
self.prototype.collection = async function(req,res){
	try{
		const query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		query.roles = {$nin:['root']};
		const options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		options.projection = {email: 1,activate: 1, roles: 1};
		const data = await this.mongodb.find('user',query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*get tags of users by distinct roles field
//@route('/api/users/tags')
//@method(['get'])
//@roles(['root','admin'])
*/
self.prototype.tags = async function(req,res){
	try{
		const data = await this.mongodb.distinct('user',"tag");
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*create object in users
//@route('/api/users')
//@method(['post'])
//@roles(['root','admin'])
*/
self.prototype.create = async function(req,res){
	try{
		req.body.email = req.body.email.toLowerCase();
		if(!this.helper.isEmail(req.body.email)){
			throw("El email ingresado no es válido");
		}
		if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
			throw("La contraseña ingresada debe tener al menos 5 caracteres");
		}
		let ce = await this.mongodb.count("user",{email: req.body.email});
		if(ce!=0){
			throw("El email ingresado ya está registrado");
		}
		let doc = {};
		doc.email = req.body.email;
		doc.hash = this.helper.random(10);
		doc.password = this.helper.toHash(req.body.password + req.body.email,doc.hash);
		doc.nickname = req.body.email;
		doc.notification = true;
		doc.thumb = "/assets/media/img/user.png";
		doc.roles = ["user"];
		doc.created = new Date();
		doc.activate = true;
		await this.mongodb.insertOne("user",doc);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*update object in users
//@route('/api/users/:id')
//@method(['put'])
//@roles(['root','admin'])
*/
self.prototype.update = async function(req,res){
	try{
		const row = await this.mongodb.findOne('user',req.params.id);
		switch(req.body.type){
			case 'activate':
				await this.mongodb.updateOne('user',req.params.id,{$set: {activate: (row.activate)?false:true}});
			break;
			case 'password':
				if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
					throw("La contraseña ingresada debe tener al menos 5 caracteres");
				}
				await this.mongodb.updateOne('user',req.params.id,{$set: {password: this.helper.toHash(req.body.password + row.email,row.hash)}});
			break;
			case 'notify':
				const memo = {};
				memo.to = row.email;
				memo.bcc = config.properties.admin;
				memo.subject = "Reestablecer contraseña";
				memo.hash = config.properties.host + "/account/recovery?hash=" + new Buffer(row.password).toString("base64");
				memo.html = this.render.processTemplateByPath(this.dir + config.properties.views + "account/memo.recovery.html", memo);
				await this.mailing.send(memo);
			break;
			case 'roles':
				if(req.body.roles.length==0){ 
					throw("Debe asignar al menos un rol");
				}
				await this.mongodb.updateOne('user',req.params.id,{$set: {roles: req.body.roles}});
			break;
		}
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*delete object in users
//@route('/api/users/:id')
//@method(['delete'])
//@roles(['root','admin'])
*/
self.prototype.delete = async function(req,res){
	try{
		await this.mongodb.deleteOne('user',req.params.id);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;