"use strict";

const self = function(a){
	this.dir = a.dir;
	this.auth = a.auth;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	this.push = a.push;
	
	if(config.recaptcha && config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(config.recaptcha.public,config.recaptcha.private);
		this.recaptcha.render();
	}
	
	this.google_url = "";
	if(config.google && config.google.auth && config.google.auth.enabled){
		this.google = a.google;
		this.google_url = this.google.getURL();
	}
}

self.prototype.removeLogged = async function(req){
	if(req.user){
		let user = await this.mongodb.find("user_active",{user_id: req.user._id.toString()});
		if(user.length==1){
			await this.mongodb.deleteOne("user_active",user[0]._id);
		}
		req.session.destroy();
	}
}

self.prototype.cookie = function(res,cookie){
	if(config.properties.cookie_domain){
		res.cookie("Authorization", cookie, { domain: config.properties.cookie_domain, path: "/", secure: true });
	}else{
		res.cookie("Authorization",cookie);
	}
}

/*create account
//@route('/account')
//@method(['post'])
*/
self.prototype.create = async function(req,res){
	try{
		req.body.email = req.body.email.toLowerCase();
		if(!this.helper.isEmail(req.body.email)){
			throw("El email ingresado no es válido");
		}
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
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
		doc.activate = (config.smtp.enabled)?false:true;
		await this.mongodb.insertOne("user",doc);
		this.push.notificateToAdmin("new user",req.body.email);
		if(config.smtp.enabled===true){
			let memo = {};
			memo.to = doc.email;
			memo.subject = "Activación de cuenta"
			memo.nickname = doc.nickname;
			memo.hash = config.properties.host + "/account/activate/" + new Buffer(doc.password).toString("base64");
			memo.html = this.render.processTemplateByPath(this.dir + config.properties.views + "account/memo.activate.html", memo);
			await this.mailing.send(memo);
			this.helper.renderMessage(req,res,'Usuario registrado','Se ha enviado un correo para validar su registro');
		}else{
			this.helper.renderMessage(req,res,'Usuario registrado','Se ha completado su registro correctamente');
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*login
//@route('/account/login')
//@method(['post'])
*/
self.prototype.login = async function(req,res){
	try{
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		req.body.email = req.body.email.toLowerCase();
		let rows = await this.mongodb.find("user",{email: req.body.email, activate: true});
		if(rows.length!=1){
			throw("Los datos ingresados no corresponden");
		}
		if(this.helper.toHash(req.body.password+req.body.email,rows[0].hash) != rows[0].password){
			throw("Los datos ingresados no corresponden");
		}
		let cookie = this.auth.encode(rows[0]);
		this.cookie(res,cookie);
		let active = await this.mongodb.find("user_active",{user_id: rows[0]._id.toString()});
		if(active.length!=1){
			await this.mongodb.insertOne("user_active",{user_id: rows[0]._id.toString(), email: rows[0].email, date: new Date()});
		}
		this.push.notificateToAdmin("user login",req.body.email);
		if(req.session.redirectTo){
			res.redirect(req.session.redirectTo);
		}else{
			res.redirect("/");
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*update account
//@route('/account/update')
//@method(['post'])
//@roles(['root','admin','user'])
*/
self.prototype.update = async function(req,res){
	try{
		let updated = {
			$set: {
				nickname: req.body.nickname
			}
		};
		let redirect = "/";//"/account/info";
		if(!req.user.google && req.body.password!=req.user.password){
			if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){
				throw("La contraseña ingresada debe tener al menos 5 caracteres");
			}else{
				updated["$set"]["password"] = this.helper.toHash(req.body.password + req.user.email,req.user.hash);
				redirect = "/account/logout";
			}
		}
		await this.mongodb.updateOne("user",req.user._id,updated);
		res.redirect(redirect);
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*logout
//@route('/account/logout')
//@method(['get'])
//@roles(['root','admin','user'])
*/
self.prototype.logout = async function(req,res){
	try{
		await this.removeLogged(req);
		this.cookie(res,"null");
		res.redirect("/");
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*activate account
//@route('/account/activate/:hash')
//@method(['get'])
*/
self.prototype.activate = async function(req,res){
	try{
		let hash = new Buffer(req.params.hash, "base64").toString("ascii");
		let row = await this.mongodb.find("user",{password: hash});
		if(row.length!=1){
			throw("se ha encontrado más de un usuario asociado a este hash");
		}
		row[0].activate = true;
		await this.mongodb.updateOne("user",row[0]._id,row[0]);
		this.push.notificateToAdmin("user activate",row[0].email);
		this.helper.renderMessage(req,res,'Usuario activado','Se ha completado su registro correctamente');
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*desactivate account
//@route('/account/desactivate/:hash')
//@method(['get'])
*/
self.prototype.desactivate = async function(req,res){
	try{
		let hash = new Buffer(req.params.hash, "base64").toString("ascii");
		let row = await this.mongodb.find("user",{password: hash});
		if(row.length!=1){
			throw("se ha encontrado más de un usuario asociado a este hash");
		}
		row[0].activate = null;
		await this.mongodb.updateOne("user",row[0]._id,row[0]);
		this.push.notificateToAdmin("user desactivate",row[0].email);
		this.helper.renderMessage(req,res,'Usuario desactivado','Se ha completado su desactivación correctamente');
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*forget account
//@route('/account/forget')
//@method(['post'])
*/
self.prototype.forget = async function(req,res){
	try{
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		req.body.email = req.body.email.toLowerCase();
		let user = await this.mongodb.find("user",{email: req.body.email});
		if(user.length!=1){
			throw("Los datos ingresados no corresponden");
		}
		let memo = {};
		memo.to = req.body.email;
		memo.bcc = config.properties.admin;
		memo.subject = "Reestablecer contraseña";
		memo.hash = config.properties.host + "/account/recovery?hash=" + new Buffer(user[0].password).toString("base64");
		memo.html = this.render.processTemplateByPath(this.dir + config.properties.views + "account/memo.recovery.html", memo);
		await this.mailing.send(memo);
		this.push.notificateToAdmin("user forget",req.body.email);
		this.helper.renderMessage(req,res,'Recuperación de cuenta','Se ha enviado un correo para poder reestablecer su contraseña');
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*recovery account
//@route('/account/recovery')
//@method(['get','post'])
*/
self.prototype.recovery = async function(req,res){
	try{
		switch(req.method.toLowerCase()){
			case "get":
				res.render("index",{hash: req.query.hash, ...this.helper.toRender(req), onOpen: {app: "account", action: "recovery", data: {}}});
			break;
			case "post":
				if(this.recaptcha!=undefined){
					await this.helper.recaptcha(this.recaptcha,req);
				}
				let user = await this.mongodb.find("user",{password:  new Buffer(req.body.hash,"base64").toString("ascii")});
				if(user.length!=1){
					throw("Los datos ingresados no corresponden");
				}
				let updated = {$set: {password: this.helper.toHash(req.body.password + user[0].email,user[0].hash)}};
				await this.mongodb.updateOne("user",user[0]._id,updated);
				this.push.notificateToAdmin("user recovery",user[0].email);
				this.helper.renderMessage(req,res,'Actualización de contraseña','Se ha actualizaco la contraseña correctamente');
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*root create account
//@route('/api/user')
//@method(['post'])
//@roles(['root'])
*/
self.prototype.createByAdmin = async function(req,res){
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
		res.send({data: null, error: e});
	}
}

/*google auth2
//@route('/user/auth/google/callback')
//@method(['get'])
*/
self.prototype.google_login = async function(req,res){
	try{
		let user = await this.google.getUserInfo(req.query.code);
		if(user==null){
			throw(this.google.error);
		}
		let row = await this.mongodb.find("user",{email: user.emails[0].value});
		if(row.length!=1){
			row = {};
			row.email = user.emails[0].value;
			row.hash = this.helper.random(10);
			row.password = this.helper.toHash(row.hash + user.emails[0].value,row.hash);
			row.nickname = user.displayName;
			row.notification = true;
			row.thumb = user.image.url;
			row.roles = ["user"];
			row.created = new Date();
			row.activate = true
			row.google = user;
			await this.mongodb.insertOne("user",row);
			row = await this.mongodb.find("user",{email: user.emails[0].value});
		}else{
			let updated = {
				$set: {
					//nickname: user.displayName,
					//thumb: user.image.url,
					google: user
				}
			};
			row = row[0];
			await this.mongodb.updateOne("user",row._id,updated);
		}
		let cookie = this.auth.encode(row);
		this.cookie(res,cookie);
		let active = await this.mongodb.find("user_active",{user_id: row._id.toString()});
		if(active.length!=1){
			await this.mongodb.insertOne("user_active",{user_id: row._id.toString(), email: row.email, date: new Date()});
		}
		this.push.notificateToAdmin("user login by google",row.email);
		if(req.session.redirectTo){
			res.redirect(req.session.redirectTo);
		}else{
			res.redirect("/");
		}
		
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

/*google url
//@route('/api/account/google_auth')
//@method(['get'])
*/
self.prototype.getURL = async function(req,res){
	res.send({data: this.google_url});
}

/*used in comments
//@route('/api/account/:id')
//@method(['get'])
//@roles(['root','admin','user'])
*/
self.prototype.public = async function(req,res){
	try{
		const user = await this.mongodb.findOne("user",req.params.id);
		if(user==null){
			res.send({data: {nickname: 'Desconocido', thumb: '/assets/media/img/user.png'}});
		}
		res.send({data: {nickname: user.nickname, thumb: user.thumb}});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

module.exports = self;