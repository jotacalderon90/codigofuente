"use strict";

const helper = require('./lib/helper');
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const push = require('./lib/push');
const render = require('./lib/render');
const logger = require('./lib/log')('route.default');

const self = function(){
	
}

/*pwa
//@route('/')
//@method(['get'])
*/
self.prototype.index = async function(req,res,next){
	try{
		req.user = await helper.getUser(req);
		logger.request(helper.reqToLog(req));
		helper.saveLog(req);
		helper.render(req,res,'index');	
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*vue
//@route('/vue')
//@method(['get'])
*/
self.prototype.vue = async function(req,res,next){
	try{
		helper.render(req,res,'indexVue');
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*contact form
//@route('/api/message')
//@method(['post'])
*/
self.prototype.message = async function(req,res,next){
	try{
		logger.request(helper.reqToLog(req));
		req.body.email = req.body.email.toLowerCase();
		if(!helper.isEmail(req.body.email)){
			throw("El email ingresado no es válido");
		}
		await helper.recaptcha(req);
		req.body.created = new Date();
		req.body.to = req.body.email;
		req.body.html = render.process("message/memo.html",req.body);
		mongodb.insertOne("message",req.body);
		if(config.smtp.enabled){
			mailing.send(req.body);
		}
		helper.insertUserIfNotExist(req);
		push.notificateToAdmin("message from site",req.body.email + ", " + req.body.message);
		res.json({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*pwa manifest
//@route('/manifest.json')
//@method(['get'])
*/
self.prototype.manifest = async function(req,res,next){
	try{
		res.json(config.pwa.manifest);
	}catch(e){
		helper.onError(req,res,e);
	}
}

module.exports = new self();