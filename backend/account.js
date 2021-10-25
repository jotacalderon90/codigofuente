"use strict";

const jwt = require('./lib/jwt');
const googleapis = require('./lib/googleapis');
const helper = require('./lib/helper');
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const push = require('./lib/push');
const render = require('./lib/render');
const logger = require('./lib/log')('route.account');

const removeLogged = async function(req){
	if(req.user){
		req.session.destroy();
	}
}

const cookie = function(res,cookie){
	if(config.properties.cookie_domain){
		res.cookie("Authorization", cookie, { domain: config.properties.cookie_domain, path: "/", secure: true });
	}else{
		res.cookie("Authorization",cookie);
	}
}

const self = function(){
	
}


/*create account
//@route('/account')
//@method(['post'])
*/
self.prototype.create = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		req.body.email = req.body.email.toLowerCase();
		if(!helper.isEmail(req.body.email)){
			throw("El email ingresado no es válido");
		}
		await helper.recaptcha(req);
		if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
			throw("La contraseña ingresada debe tener al menos 5 caracteres");
		}
		let ce = await mongodb.count("user",{email: req.body.email});
		if(ce!=0){
			throw("El email ingresado ya está registrado");
		}
		const doc = {};
		doc.email = req.body.email;
		doc.hash = helper.random(10);
		doc.password = helper.toHash(req.body.password + req.body.email,doc.hash);
		doc.nickname = req.body.email;
		doc.notification = true;
		doc.thumb = "/assets/media/img/user.png";
		doc.roles = ["user"];
		doc.created = new Date();
		doc.activate = (config.smtp.enabled)?false:true;
		await mongodb.insertOne("user",doc);
		push.notificateToAdmin("new user",req.body.email);
		let msg = 'Se ha completado su registro correctamente';
		if(config.smtp.enabled===true){
			let memo = {};
			memo.to = doc.email;
			memo.subject = "Activación de cuenta"
			memo.nickname = doc.nickname;
			memo.hash = config.properties.host + "/account/activate/" + new Buffer(doc.password).toString("base64");
			memo.html = render.process("account/memo.activate.html", memo);
			await mailing.send(memo);
			msg = 'Se ha enviado un correo para validar su registro';
		}
		helper.renderMessage(req,res,'Usuario registrado',msg);
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*login
//@route('/account/login')
//@method(['post'])
*/
self.prototype.login = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		await helper.recaptcha(req);
		req.body.email = req.body.email.toLowerCase();
		let rows = await mongodb.find("user",{email: req.body.email, activate: true});
		if(rows.length!=1){
			throw("Los datos ingresados no corresponden");
		}
		if(helper.toHash(req.body.password+req.body.email,rows[0].hash) != rows[0].password){
			throw("Los datos ingresados no corresponden");
		}
		cookie(res,jwt.encode(rows[0]));
		push.notificateToAdmin("user login",req.body.email);
		if(req.session.redirectTo){
			res.redirect(req.session.redirectTo);
		}else{
			res.redirect("/");
		}
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*
//@route('/account/info')
//@method(['get'])
*/
self.prototype.info = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
		helper.render(req,res,'index',{app: 'account', action: 'open'});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*update account
//@route('/account/update')
//@method(['post'])
*/
self.prototype.update = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
		let updated = {
			$set: {
				nickname: req.body.nickname
			}
		};
		let redirect = "/account/info";
		if(!req.user.google && req.body.password!=req.user.password){
			if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){
				throw("La contraseña ingresada debe tener al menos 5 caracteres");
			}else{
				updated["$set"]["password"] = helper.toHash(req.body.password + req.user.email,req.user.hash);
				redirect = "/account/logout";
			}
		}
		await mongodb.updateOne("user",req.user._id,updated);
		res.redirect(redirect);
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*logout
//@route('/account/logout')
//@method(['get'])
*/
self.prototype.logout = async function(req,res){
	try{
		//logger.request(helper.reqToLog(req));
		//req.user = await helper.getUser(req);
		//if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
		await removeLogged(req);
		cookie(res,"null");
		res.redirect("/");
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*activate account
//@route('/account/activate/:hash')
//@method(['get'])
*/
self.prototype.activate = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		const hash = new Buffer(req.params.hash, "base64").toString("ascii");
		const row = await mongodb.find("user",{password: hash});
		if(row.length!=1){
			throw("Error al obtener usuario asociado al hash");
		}
		row[0].activate = true;
		await mongodb.updateOne("user",row[0]._id,row[0]);
		push.notificateToAdmin("user activate",row[0].email);
		helper.renderMessage(req,res,'Usuario activado','Se ha completado su registro correctamente');
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*desactivate account
//@route('/account/desactivate/:hash')
//@method(['get'])
*/
self.prototype.desactivate = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		const hash = new Buffer(req.params.hash, "base64").toString("ascii");
		const row = await mongodb.find("user",{password: hash});
		if(row.length!=1){
			throw("Error al obtener usuario asociado al hash");
		}
		row[0].activate = null;
		await mongodb.updateOne("user",row[0]._id,row[0]);
		push.notificateToAdmin("user desactivate",row[0].email);
		helper.renderMessage(req,res,'Usuario desactivado','Se ha completado su desactivación correctamente');
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*forget account
//@route('/account/forget')
//@method(['post'])
*/
self.prototype.forget = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		await helper.recaptcha(req);
		req.body.email = req.body.email.toLowerCase();
		const user = await mongodb.find("user",{email: req.body.email});
		if(user.length!=1){
			throw("Error al obtener usuario");
		}
		const memo = {};
		memo.to = req.body.email;
		memo.bcc = config.properties.admin;
		memo.subject = "Reestablecer contraseña";
		memo.hash = config.properties.host + "/account/recovery?hash=" + new Buffer(user[0].password).toString("base64");
		memo.html = render.process("account/memo.recovery.html", memo);
		await mailing.send(memo);
		push.notificateToAdmin("user forget",req.body.email);
		helper.renderMessage(req,res,'Recuperación de cuenta','Se ha enviado un correo para poder reestablecer su contraseña');
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*recovery account
//@route('/account/recovery')
//@method(['get','post'])
*/
self.prototype.recovery = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		switch(req.method.toLowerCase()){
			case "get":
				res.render("index",{hash: req.query.hash, ...helper.toRender(req), onOpen: {app: "account", action: "recovery", data: {}}});
			break;
			case "post":
				await helper.recaptcha(req);
				const user = await mongodb.find("user",{password:  new Buffer(req.body.hash,"base64").toString("ascii")});
				if(user.length!=1){
					throw("Los datos ingresados no corresponden");
				}
				const updated = {$set: {password: helper.toHash(req.body.password + user[0].email,user[0].hash)}};
				await mongodb.updateOne("user",user[0]._id,updated);
				push.notificateToAdmin("user recovery",user[0].email);
				helper.renderMessage(req,res,'Actualización de contraseña','Se ha actualizaco la contraseña correctamente');
			break;
		}
	}catch(e){
		helper.onError(req,res,e);
	}
}



/*google auth2
//@route('/user/auth/google/callback')
//@method(['get'])
*/
self.prototype.google_login = async function(req,res){
	try{
		logger.request(helper.reqToLog(req));
		const user = await googleapis.getUserInfo(req.query.code);
		if(user.error){
			throw(user.error);
		}
		let row = await mongodb.find("user",{email: user.emails[0].value});
		if(row.length!=1){
			row = {};
			row.email = user.emails[0].value;
			row.hash = helper.random(10);
			row.password = helper.toHash(row.hash + user.emails[0].value,row.hash);
			row.nickname = user.displayName;
			row.notification = true;
			row.thumb = user.image.url;
			row.roles = ["user"];
			row.created = new Date();
			row.activate = true
			row.google = user;
			await mongodb.insertOne("user",row);
			//row = await mongodb.find("user",{email: user.emails[0].value});
		}else{
			let updated = {
				$set: {
					//nickname: user.displayName,
					//thumb: user.image.url,
					google: user
				}
			};
			row = row[0];
			await mongodb.updateOne("user",row._id,updated);
		}
		cookie(res,jwt.encode(row));
		push.notificateToAdmin("user login by google",row.email);
		if(req.session.redirectTo){
			res.redirect(req.session.redirectTo);
		}else{
			res.redirect("/");
		}
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*root create account
//@route('/api/user')
//@method(['post'])
*/
self.prototype.createByAdmin = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
		req.body.email = req.body.email.toLowerCase();
		if(!helper.isEmail(req.body.email)){
			throw("El email ingresado no es válido");
		}
		if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
			throw("La contraseña ingresada debe tener al menos 5 caracteres");
		}
		let ce = await mongodb.count("user",{email: req.body.email});
		if(ce!=0){
			throw("El email ingresado ya está registrado");
		}
		const doc = {};
		doc.email = req.body.email;
		doc.hash = helper.random(10);
		doc.password = helper.toHash(req.body.password + req.body.email,doc.hash);
		doc.nickname = req.body.email;
		doc.notification = true;
		doc.thumb = "/assets/media/img/user.png";
		doc.roles = ["user"];
		doc.created = new Date();
		doc.activate = true;
		await mongodb.insertOne("user",doc);
		res.json({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*google url
//@route('/api/account/google_auth')
//@method(['get'])
*/
self.prototype.getURL = async function(req,res){
	try{
		res.json({data: googleapis.getURL()});
	}catch(e){
		helper.onError(req,res,e);
	}
}

/*used in comments
//@route('/api/account/:id')
//@method(['get'])
*/
self.prototype.public = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
		
		const user = await mongodb.findOne("user",req.params.id);
		if(user==null){
			res.json({data: {nickname: 'Desconocido', thumb: '/assets/media/img/user.png'}});
		}else{
			res.json({data: {nickname: user.nickname, thumb: user.thumb}});
		}
	}catch(e){
		helper.onError(req,res,e);
	}
}

module.exports = new self();