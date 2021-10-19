"use strict";

const crypto = require("crypto");
const fs	 = require("fs");
const http 	 = require("http");
const https  = require("https");

const self = function(a){
	this.dir = (a && a.dir)?a.dir:null;
	this.socket_methods = [];
}

self.prototype.cleaner = function(cadena){
	var specialChars = "!@#$^&%*()+=-[]\/{}|:<>?,.`";
	for (var i = 0; i < specialChars.length; i++) {
		cadena= cadena.replace(new RegExp("\\" + specialChars[i], 'gi'), '');
	}
	cadena = cadena.toLowerCase();
	cadena = cadena.replace(/ /g,"-");
	cadena = cadena.replace(/á/gi,"a");
	cadena = cadena.replace(/é/gi,"e");
	cadena = cadena.replace(/í/gi,"i");
	cadena = cadena.replace(/ó/gi,"o");
	cadena = cadena.replace(/ú/gi,"u");
	cadena = cadena.replace(/ñ/gi,"n");
	return cadena;
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

self.prototype.getUser = function(req){
	try{
		return req.session.passport.user.email;
	}catch(e){
		return "anonymous";
	}
}

self.prototype.isEmail = function(email){
	if(email!=undefined && email.trim()!="" && /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)){
		return true;
	}else{
		return false;
	}
}

self.prototype.exist = function(path){
	if(fs.existsSync(this.dir + config.properties.views + "/" + path + ".html")){
		return true;
	}else{
		return false;
	}
}

self.prototype.recaptcha = function(recaptcha,req){
	return new Promise(function(resolve,reject){
		recaptcha.verify(req, function(error){
			if(error){
				return reject(error);
			}else{
				resolve(true);
			}
		});
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

self.prototype.toRender = function(req){
	return {user: req.user, ip: req.real_ip, headers: req.headers, btnCloseToIndex: false};
}

self.prototype.toRenderError = function(req,e){
	return {...this.toRender(req), onOpen: {app: "promise", action: "messageFromServer", data: {title: "Error en el Servidor", msg: e.toString(), class: "danger"}}};
}

self.prototype.toRenderSuccess = function(req,t,e,c){
	return {...this.toRender(req), onOpen: {app: "promise", action: "messageFromServer", data: {title: t, msg: e.toString(), class: c || "success"}}};
}

self.prototype.renderMessage = function(req,res,t,e,c){
	res.render("index",{...this.toRenderSuccess(req,t,e,c)});
}

self.prototype.saveUser = function(user){
	return {
		_id: user._id,
		nickname: user.nickname,
		thumb: user.thumb
	}
}

module.exports = self;