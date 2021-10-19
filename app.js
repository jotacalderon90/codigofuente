const logger = function(msg,type){
	console[(type?type:'log')](new Date().toLocaleString() + " == " + msg);
}

logger('start application');

logger('import readline');
const readline = require('readline');

logger('import fs');
const fs = require('fs');

logger('import path');
const path = require('path');

logger('import express');
const express = require('express');

logger('import body-parser');
const bodyParser = require('body-parser');

logger('import cookie-parser');
const cookieParser = require('cookie-parser');

logger('import express-session');
const session = require('express-session');

logger('import express-fileupload');
const upload = require('express-fileupload');

logger('import helmet');
const helmet = require('helmet');

logger('import compression');
const compression = require('compression');

logger('import http');
const http = require('http');

logger('import cors');
const cors = require('cors');

logger('import trascender.router');
const router = require('trascender.router');

logger('import trascender.render');
const render = require('trascender.render');

const self = function(){
	try{
		this.start();
	}catch(e){
		console.error(e);
		logger(e,'error');
		process.exit();
	}
}

self.prototype.start = async function(){
	
	logger('set default data');
	this.setDefaultData();
	
	logger('set default express');
	this.setDefaultExpress();

const mon = require('./app/backend/mongodb');
console.log(mon);	
	
	logger('import local libs');
	this.importLIBS();
	
	logger('start mongoDB');
	if(this.mongodb){
		await this.mongodb.start();
	}
	
	logger('execute first start');
	if(!fs.existsSync(config.properties.log)){
		await this.importDefaultData();
		await this.configDefaultRoot();
	}
	
	logger('public files');
	this.publicFiles();
	
	logger('public folders');
	this.publicFolders();
	
	logger('public routers');
	new router(this,this.dir + '/app/backend/rest');
	
	logger('public redirect');
	this.publicRedirect();
	
	logger('public 404');
	this.public404();
	
	logger('open Port');
	this.openPort(config.properties.port)	
}

self.prototype.setDefaultData = function(){
	
	//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';//20200824:eliminar si no sucede nada especial
	//this.process = process;//20200824:eliminar si no sucede nada especial
	
	this.dir = __dirname;
	
	const args = process.argv.filter((r)=>{return r.indexOf('=')>-1});
	this.args = {};
	for(let i=0;i<args.length;i++){
		args[i] = args[i].split('=');
		this.args[args[i][0]] = args[i][1];
	}
	const m = (this.args.module || 'app');
	
	const config = JSON.parse(fs.readFileSync('./app/backend/config/app.json','utf8'));
	
	config.properties.log = './app/backend/log/' + m + '.csv';
	config.properties.limit = '50mb';
	config.properties.object = './app/backend/script/objects.json';
	config.properties.lib = './app/backend/lib/';
	config.properties.views = '/app/frontend/app/';
	
	config.files = (config.files)?config.files:[];
	config.files.push({uri: '/favicon.ico',	src: '/app/frontend/assets/media/img/favicon.ico'});
	config.files.push({uri: '/robots.txt',		src: '/app/frontend/assets/media/doc/robots.txt'});
	config.files.push({uri: '/sw.js',			src: '/app/frontend/assets/pwa/sw.js'});
	
	config.folders = (config.folders)?config.folders:[];
	config.folders.push({uri: '/', src: '/app/frontend'});

	global.config = config;
}

self.prototype.setDefaultExpress = function(){
	this.express = express();
	this.express.use(bodyParser.json({limit: config.properties.limit})); 
	this.express.use(bodyParser.urlencoded({extended: true}));
	this.express.use(cookieParser());
	this.express.use(compression());
	
	const sessionOptions = {
		secret: config.properties.secret,
		resave: false,
		saveUninitialized: false,
		cookie: (config.properties.cookie_domain)?config.properties.cookie_domain:undefined
	}
	
	this.express.use(session(sessionOptions));
	this.express.use(upload());
	this.express.use(helmet());
	this.server = http.Server(this.express);
	this.render = new render(this, __dirname + config.properties.views);
	
	if(config.properties.cors===true){
		this.express.use(cors());
	}
}

self.prototype.importLIBS = function(){
	const libFolder = config.properties.lib;
	if(fs.existsSync(libFolder)){
		const libs = fs.readdirSync(libFolder,"utf8").filter((row)=>{
			return fs.statSync(path.join(libFolder,row)).isFile();
		});
		for(let i=0;i<libs.length;i++){
			const l = libs[i].replace(".js","");
			logger('import lib ' + l);
			this[l]	= new(require(libFolder + l))(this);
		}
	}
}

self.prototype.importDefaultData = async function(){
	let r;
	const objects = JSON.parse(fs.readFileSync(config.properties.object,"utf8"));
	for(let i=0;i<objects.length;i++){
		r = await this.mongodb.count("object",{name: objects[i].name});
		if(r==0){
			r = await this.mongodb.insertOne("object",objects[i]);
			logger('insert lib ' + r.insertedCount + ' object ' + objects[i].name);
			if(r.insertedCount==1){
				if(objects[i].doc){
					for(let x=0;x<objects[i].doc.length;x++){
						r = await this.mongodb.insertOne(objects[i].name,objects[i].doc[x]);
						logger('insert lib ' + r.insertedCount + ' document in ' + objects[i].name);
					}
				}
			}
		}
	}
}

self.prototype.configDefaultRoot = async function(){
	let r = await this.readline.ask("Debe tener al menos un usuario root, ¿desea crearlo? [S/N]?: ");
	if(r.toUpperCase()=="S"){
		const user = await this.readline.ask("Ingrese un nombre de usuario: ");
		r = await this.mongodb.count("user",{email: user});
		if(r==0){
			const pass = await this.readline.ask("Ingrese una contraseña: ");
			const hash = this.helper.random(10);
			const doc = {
				email: user,
				hash: hash,
				password: this.helper.toHash(pass + user,hash),
				nickname: user,
				notification: true,
				thumb: "/assets/media/img/user.png",
				roles: ["root"],
				created: new Date().toLocaleString(),
				activate: true
			};
			
			r = await this.mongodb.insertOne("user",doc);
			logger('user root created correctly');
		}else{
			logger('user ' + user + ' already exist');
		}
	}
}

self.prototype.beforeExecute = function(params){
	return async (req,res,next) => {
		try{
			req.type = params.type;
			
			req.real_ip = (req.connection.remoteAddress!="::ffff:127.0.0.1" && req.connection.remoteAddress!='::1')?req.connection.remoteAddress:req.headers["x-real-ip"];
			
			req.token = this.getToken(req);
			
			if(req.token!=null && req.token!=undefined && !req.token.error){
				req.user = await this.mongodb.findOne("user",req.token.sub);
			}
			
			this.new_request(req);
			
			if(params.roles==undefined || params.roles.length==0){
				return next();
			}else if(req.token==null || req.token==undefined){
				throw("Acción restringida"); 
			}else if(req.token.error){
				throw(req.token.error); 
			}else{
				let a = await this.mongodb.find("user_active",{user_id: req.token.sub});
				if(a.length==0){ 
					throw("Acción restringida"); 
				}
				a = false;
				for(let i=0;i<params.roles.length;i++){
					if(req.user.roles.indexOf(params.roles[i])>-1){
						a = true;
					}
				}
				if(a){
					return next();
				}else{
					throw("Acción restringida");
				}
			}
		}catch(e){
			console.error(e);
			if(req.url.indexOf("/api/")==-1){
				req.session.redirectTo = req.url;
			}
			res.status(401).render("index",{user: req.user, ip: req.real_ip, onOpen: {app: "promise", action: "messageFromServer", data: {title: "Error 401", msg: e.toString(), class: "danger"}}});
		}
	}
}

self.prototype.getToken = function(req){
	let token = null;
	if(req.headers && req.headers.cookie){
		let cookies = req.headers.cookie.split(";");
		for(let i=0;i<cookies.length;i++){
			if(cookies[i].indexOf("Authorization=")>-1 && cookies[i].indexOf("=null")==-1){
				token = this.auth.decode(cookies[i].split("=")[1].split(";")[0]);
				token = (token==null)?{error: this.auth.error.toString()}:token;
			}
		}
	}
	return token;
}

self.prototype.new_request = function(req){
	req.created = new Date().toLocaleString();
	let content = "\n";
	content += req.created + ";";
	content += req.type + ";";
	content += req.real_ip + ";";
	content += ((req.user)?req.user.email:null) + ";";
	content += req.originalUrl + ";";
	content += req.method + ";";
	content += JSON.stringify(req.body);
	console.log(content);
	fs.appendFile(config.properties.log, content, function (err) {});		
}

self.prototype.getFile = function(file){
	return function(req,res){
		res.sendFile(file);
	};
}

self.prototype.getRedirect = function(to){
	return function(req,res){
		res.redirect(to);
	};
}

self.prototype.publicFiles = function(){
	if(config.files){
		for(let i=0;i<config.files.length;i++){
			this.express.get(config.files[i].uri, this.beforeExecute({type: "FILE", roles: config.files[i].roles}), this.getFile(this.dir + config.files[i].src));
		}
	}
}

self.prototype.publicFolders = function(){
	if(config.folders){
		for(let i=0;i<config.folders.length;i++){
			this.express.use(config.folders[i].uri, this.beforeExecute({type: "FOLDER", roles: config.folders[i].roles}), express.static(this.dir + config.folders[i].src));
		}
	}
}

self.prototype.publicRedirect = function(){
	if(config.redirect){
		for(let i=0;i<config.redirect.length;i++){
			this.express.use(config.redirect[i].from, this.beforeExecute({type: "REDIRECT", roles: config.redirect[i].roles}), this.getRedirect(config.redirect[i].to));
		}
	}
}

self.prototype.public404 = function(){
	this.express.use(function(req,res,next){
		logger("error 404 " + req.originalUrl);
		res.status(404).render("404",{user: req.user, ip: req.real_ip, onOpen: {app: "promise", action: "messageFromServer", data: {title: "Error 404", msg: "URL not found: " + req.originalUrl, class: "danger"}}});
	});
}

self.prototype.openPort = function(port){
	this.server.listen(port, () => {
		logger("started trascender in " + port + " port");
	});
}

module.exports = new self();