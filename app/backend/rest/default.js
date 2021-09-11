"use strict";

const self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	this.push = a.push;
	
	if(this.config.recaptcha && this.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(this.config.recaptcha.public,this.config.recaptcha.private);
		this.recaptcha.render();
	}
}

self.prototype.setDefaultBody = function(req){
	req.body.created = new Date();
	req.body.to = req.body.email;
	req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "message/memo.html",req.body);
	return req;
}
self.prototype.insertUserIfNotExist = async function(req){
	const e = await this.mongodb.count("user",{email: req.body.email});
	if(e==0){
		let u = {};
		u.email = req.body.email;
		u.hash = this.helper.random(10);
		u.password = this.helper.toHash("123456" + u.email,u.hash);
		u.nickname = u.email;
		u.notification = true;
		u.thumb = "/media/img/user.png";
		u.roles = ["user","message"];
		u.created = new Date();
		u.activate = true;
		await this.mongodb.insertOne("user",u);
		console.log("nuevo usuario insertado");
	}else{
		console.log("usuario ya insertado: " + e);
	}
}
self.prototype.getDefaultData = async function(){
	try{
		const data = {
			product: await this.mongodb.find('product',{},{limit: 8,sort:{created: -1}, projection: {title: 1,img:1,price:1,uri: 1}}),
			blog: await this.mongodb.find('blog',{/*tag: {$in: ['Historia de la Informática']}*/},{limit: 6,sort:{created: -1}})
		};
		//console.log(data);
		return data;
	}catch(e){
		console.log(e);
		return {};
	}
}

/*pwa
//@route('/')
//@method(['get'])
*/
self.prototype.index = async function(req,res,next){
	this.mongodb.insertOne("log",{url: req.originalUrl, ip: req.real_ip, date: new Date(), headers: req.headers, body: req.body, user: req.user});
	res.render("index",{...this.helper.toRender(req), /*onOpen: {app: 'landing', action: 'open', data: {}}, */pushcode: this.push.publicKey, landing: await this.getDefaultData()});
}

/*vue
//@route('/vue')
//@method(['get'])
*/
self.prototype.vue = async function(req,res,next){
	res.render("indexVue",{...this.helper.toRender(req), /*onOpen: {app: 'landing', action: 'open', data: {}}, */pushcode: this.push.publicKey, landing: await this.getDefaultData()});
}

/*contact form
//@route('/api/message')
//@method(['post'])
*/
self.prototype.message = async function(req,res,next){
	try{
		req.body.email = req.body.email.toLowerCase();
		if(!this.helper.isEmail(req.body.email)){
			throw("IMAIL INVALIDO");
		}
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		req = this.setDefaultBody(req);
		this.mongodb.insertOne("message",req.body);
		if(this.config.smtp.enabled){
			this.mailing.send(req.body);
		}
		this.insertUserIfNotExist(req);
		this.push.notificateToAdmin("message from site",req.body.email + ", " + req.body.message);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

/*pwa manifest
//@route('/manifest.json')
//@method(['get'])
*/
self.prototype.manifest = async function(req,res,next){
	res.json(this.config.pwa.manifest);
}

module.exports = self;