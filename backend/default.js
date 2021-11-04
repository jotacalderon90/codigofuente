"use strict";

const logger = require('./lib/log')('route.default');
const helper = require('./lib/helper');
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const push = require('./lib/push');
const render = require('./lib/render');

module.exports = {
	renderHome: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			helper.saveLog(req);
			helper.render(req,res,'index');	
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	renderAbout: async function(req,res){
		helper.render(req,res,'about/page',{app: 'about', action: 'open'});
	},
	favicon: function(req,res){
		res.sendFile(config.dir + '/frontend/assets/media/img/favicon.ico');
	},
	robots: function(req,res){
		res.sendFile(config.dir + '/frontend/assets/media/doc/robots.txt');
	},
	renderVue: async function(req,res){
		helper.render(req,res,'indexVue');
	},
	message: async function(req,res){
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
};