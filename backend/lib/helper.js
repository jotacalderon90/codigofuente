"use strict";

const crypto = require("crypto");
const fs	 = require("fs");
const http 	 = require("http");
const https  = require("https");

const logger = require('./log')('lib.helper');
const jwt = require('./jwt');
const mongodb  = require("./mongodb");
const readline = require('./readline');
const push = require('./push');

const self = function(){
	if(config.recaptcha && config.recaptcha.enabled===true){
		this.captcha = require("express-recaptcha");
		this.captcha.init(config.recaptcha.public,config.recaptcha.private);
		this.captcha.render();
	}else{
		this.captcha = undefined;
	}
}

self.prototype.firstRun = async function(){
	try{
		await this.importDefaultData();
		await this.configDefaultRoot();		
	}catch(e){
		logger.info(e);
	}
}

self.prototype.importDefaultData = async function(){
	let r;
	const objects = JSON.parse(fs.readFileSync(config.dir + '/backend/lib/config/objects.json',"utf8"));
	for(let i=0;i<objects.length;i++){
		r = await mongodb.count("object",{name: objects[i].name});
		if(r==0){
			r = await mongodb.insertOne("object",objects[i]);
			logger.info('insert lib ' + r.insertedCount + ' object ' + objects[i].name);
			if(r.insertedCount==1){
				if(objects[i].doc){
					for(let x=0;x<objects[i].doc.length;x++){
						r = await mongodb.insertOne(objects[i].name,objects[i].doc[x]);
						logger.info('insert lib ' + r.insertedCount + ' document in ' + objects[i].name);
					}
				}
			}
		}
	}
}

self.prototype.configDefaultRoot = async function(){
	let r = await readline.ask("Debe tener al menos un usuario root, ¿desea crearlo? [S/N]?: ");
	if(r.toUpperCase()=="S"){
		const user = await readline.ask("Ingrese un nombre de usuario: ");
		r = await mongodb.count("user",{email: user});
		if(r==0){
			const pass = await readline.ask("Ingrese una contraseña: ");
			const hash = this.random(10);
			const doc = {
				email: user,
				hash: hash,
				password: this.toHash(pass + user,hash),
				nickname: user,
				notification: true,
				thumb: "/assets/media/img/user.png",
				roles: ["root"],
				created: new Date().toLocaleString(),
				activate: true
			};
			
			r = await mongodb.insertOne("user",doc);
			logger.info('user root created correctly');
		}else{
			logger.info('user ' + user + ' already exist');
		}
	}
}

self.prototype.random = function(length){
	const possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let text = "";
	for (let i = 0; i < length; i++){
		text += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
	}
	return text;
}

self.prototype.toHash = function(text,hash){
	return crypto.createHmac("sha256", text).update(hash).digest("hex");
}

self.prototype.getToken = function(req){
	let token = null;
	if(req.headers && req.headers.cookie){
		let cookies = req.headers.cookie.split(";");
		for(let i=0;i<cookies.length;i++){
			if(cookies[i].indexOf("Authorization=")>-1 && cookies[i].indexOf("=null")==-1){
				token = jwt.decode(cookies[i].split("=")[1].split(";")[0]);	
			}
		}
	}
	return token;
}

self.prototype.getUser = async function(req){
	try{
		const token = this.getToken(req);
		if(token.sub){
			return await mongodb.findOne("user",token.sub);
		}else{
			return null;
		}
	}catch(e){
		return null;
	}
}

self.prototype.hasRole = function(req,roles){
	for(let i=0;i<roles.length;i++){
		if(req.user.roles.indexOf(roles[i])>-1){
			return true;
		}
	}
	return false;
}

self.prototype.authorize = async function(req,res,next){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null){
			throw(401);
		}
		for(let i=0;i<roles.length;i++){
			if(req.user.roles.indexOf(roles[i])>-1){
				return next();
			}
		}
		throw(401);
	}catch(e){
		if(e==401){
			logger.info(helper.reqToLog(req));
			if(req.url.indexOf("/api/")>-1){
				res.sendStatus(401);
			}else{
				req.session.redirectTo = req.url;
				res.status(401).render("index", helper.toRenderError('401',e));
			}
		}else{
			logger.info(e);
			res.sendStatus(401);
		}
	}
}

self.prototype.reqToLog = function(req){
	let content = "";
	//content += new Date().toLocaleString() + ";";
	content += this.getRealIP(req) + ";";
	content += ((req.user)?req.user.email:'anonymous') + ";";
	content += req.originalUrl + ";";
 	content += req.method + ";";
	//content += JSON.stringify(req.body);
	return content;		
}

self.prototype.saveLog = async function(req){
	mongodb.insertOne("log",{url: req.originalUrl, ip: this.getRealIP(req), date: new Date(), headers: req.headers, body: req.body, user: req.user});
}

self.prototype.isEmail = function(email){
	if(email!=undefined && email.trim()!="" && /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)){
		return true;
	}else{
		return false;
	}
}

self.prototype.getDefaultData = async function(){
	try{
		const data = {
			product: await mongodb.find('product',{},{limit: 8,sort:{created: -1}, projection: {title: 1,img:1,price:1,uri: 1}}),
			blog: await mongodb.find('blog',{},{limit: 6,sort:{created: -1}})
		};
		return data;
	}catch(e){
		logger.info(e);
		return {};
	}
}

self.prototype.insertUserIfNotExist = async function(req){
	const e = await mongodb.count("user",{email: req.body.email});
	if(e==0){
		let u = {};
		u.email = req.body.email;
		u.hash = this.random(10);
		u.password = this.toHash("123456" + u.email,u.hash);
		u.nickname = u.email;
		u.notification = true;
		u.thumb = "/media/img/user.png";
		u.roles = ["user","message"];
		u.created = new Date();
		u.activate = true;
		await mongodb.insertOne("user",u);
		logger.info("nuevo usuario insertado");
	}else{
		logger.info("usuario ya insertado: " + e);
	}
}

self.prototype.recaptcha = function(req){
	return new Promise((resolve,reject)=>{
		if(this.captcha==undefined){
			resolve(true);
		}else{		
			this.captcha.verify(req, function(error){
				if(error){
					return reject(error);
				}else{
					resolve(true);
				}
			});	
		}
	});
}

self.prototype.request = function(url){
	const r = (url.indexOf("https://")==0)?https:http;
	return new Promise(function(resolve,reject){
		r.get(url, (resp) => {
			let data = '';
			resp.on('data', (chunk) => {
				data += chunk;
			});
			resp.on('end', () => {
				try{
					const json = JSON.parse(data);
					if(json.body){
						resolve(json.body);
					}else{
						resolve(json);
					}					
				}catch(e){
					reject(e);
				}
			});
		}).on("error", (e) => {
			reject(e);
		});
	});
}

self.prototype.upload_process = function(file,path){
	return new Promise(function(resolve,reject){
		file.mv(path, function(error) {
			if (error){
				return reject(error);
			}else{
				resolve(true);
			}
		});
	});
}

self.prototype.getRealIP = function(req){
	try{
		return req.connection.remoteAddress || req.headers["x-real-ip"];
	}catch(e){
		return 'noip';
	}
}

self.prototype.render = async function(req,res,view,data){
	try{
		if(fs.existsSync(config.dir + config.properties.views + view + '.html')){
			res.status(200).render(view, {...await this.toRender(req), onOpen: data});
		}else{
			throw(view + ' not exist');
		}
	}catch(e){
		res.status(500).render("index", this.toRenderError(req,e));
	}
}

self.prototype.onError = async function(req,res,e){
	if(req.url.indexOf("/api/")>-1){
		this.onErrorAPI(req,res,e);
	}else {
		this.onErrorRENDER(req,res,e);
	}
}

self.prototype.toRender = async function(req,btn){
	return {user: req.user, ip: this.getRealIP(req), headers: req.headers, pushcode: push.publicKey, landing: await this.getDefaultData(), btnCloseToIndex: btn || false};
}

self.prototype.toRenderError = function(req,e){
	return {/*...this.toRender(req,true), */onOpen: {app: "promise", action: "messageFromServer", data: {title: e.title|| "Error en el Servidor", msg: e.msg || e.toString(), class: "danger"}}};
}

self.prototype.toRenderSuccess = async function(req,t,e,c){
	return {...this.toRender(req,true), onOpen: {app: "promise", action: "messageFromServer", data: {title: t, msg: e.toString(), class: c || "success"}}};
}

self.prototype.renderMessage = async function(req,res,t,e,c){
	res.render("index",{...this.toRenderSuccess(req,t,e,c)});
}

self.prototype.onErrorAPI = function(req,res,e){
	if(e==401){
		res.sendStatus(401);
	}else{
		res.status(500).send({error: e.toString()});
	}
}

self.prototype.onErrorRENDER = function(req,res,e){
	if(e==401){
		req.session.redirectTo = req.url;
		res.status(401).render("message", this.toRenderError(req,e));
	}else{
		res.status(500).render("message", this.toRenderError(req,e));
	}
}

self.prototype.render404 = function(req,res){
	logger.info("404 " + req.originalUrl);
	res.status(404).render("message", this.toRenderError(req,{title: 'No encontramos respuesta a su solicitud', msg: 'La URL ' +  req.originalUrl + ' no pudo ser procesada'}));
}

self.prototype.renderHtml = function(data,req,res){
	res.set('Content-Type', 'text/html');
	res.send(Buffer.from('<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="keywords" content="' + ((data[0].tag)?data[0].tag.join(','):'') + '" /><meta name="description" content="' + data[0].resume + '" /><meta name="Author" content="' + config.properties.host + '" /><title>' + data[0].title + '</title></head><body>' + data[0].content + '</body></html>'));
}

self.prototype.saveUser = function(user){
	return {
		_id: user._id,
		nickname: user.nickname,
		thumb: user.thumb
	}
}

module.exports = new self();