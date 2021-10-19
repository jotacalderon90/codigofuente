"use strict";

const fs = require("fs");

const self = function(a){
	this.dir = a.dir;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	
	this.setWorkflow("ecommerce");
	
	if(config.recaptcha && config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(config.recaptcha.public,config.recaptcha.private);
		this.recaptcha.render();
	}
	
}

/*ECOMMERCE*/
self.prototype.setMemo = function(doc){
	doc.subject = this.workflow.on[doc.status.toString()].subject;
	doc.text = this.workflow.on[doc.status.toString()].text;
	doc.title = this.workflow.on[doc.status.toString()].title;
	doc.config = config;
	return doc;
}
	
self.prototype.setMemoClient = function(doc){
	doc.to = doc.email;
	doc.bcc = config.properties.admin;
	doc.btn = this.workflow.on[doc.status.toString()].btnToClient;
	if(doc.btn!=undefined){
		for(var i=0;i<doc.btn.length;i++){
			doc.btn[i].href = config.properties.host + "/" + "ecommerce" + "/transaction/" + (new Buffer(doc.insertedId).toString("base64"));
		}
	}
	doc.html = this.render.processTemplateByPath(this.dir + config.properties.views + "ecommerce/memo.html",doc);
	return doc;
}
	
self.prototype.setMemoAdmin = function(doc){
	doc.subject = doc.subject + " [copia al administrador]";
	doc.to = config.properties.admin;
	doc.btn = this.workflow.on[doc.status.toString()].btnToAdmin;
	if(doc.btn!=undefined){
		for(var i=0;i<doc.btn.length;i++){
			doc.btn[i].href = config.properties.host + "/" + "ecommerce" + "/transaction/" + (new Buffer(doc.insertedId+":"+doc.insertedId).toString("base64"));
		}
	}
	doc.html = this.render.processTemplateByPath(this.dir + config.properties.views + "ecommerce/memo.html",doc);
	return doc;
}

self.prototype.setWorkflow = async function(name){
	try{
		this.workflow = await this.mongodb.find("workflow",{name: name});
		this.workflow = this.workflow[0];
	}catch(e){
		console.log(e);
	}
}



//@route('/ecommerce/transaction')
//@method(['post'])
self.prototype.ecommerce_create = async function(req,res){
	try{

		//valid email
		if(!this.helper.isEmail(req.body.email)){ throw("El email ingresado no es válido");}
		
		//recaptcha valid
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		
		//format new document
		let doc = {};
		doc.ip = req.headers["X-Real-IP"] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		doc.email = req.body.email;
		doc.phone = req.body.phone;
		doc.message = "Cliente: " + req.body.message + " <small>" + (new Date()).toISOString() + "</small>";
		doc.product = [];
		doc.total = 0;
		for(let i=0;i<req.body.product.length;i++){
			doc.product.push({
				title: req.body.product[i].title,
				img: req.body.product[i].img,
				price: req.body.product[i].price,
				cant: req.body.product[i].cant,
				total: req.body.product[i].cant * req.body.product[i].price
			});
			doc.total += doc.product[i].total;
		}
		doc.status = 10;
		doc.created = new Date();
		
		//insert document
		let row = await this.mongodb.insertOne("ecommerce",doc);
		
		//config notification
		doc.insertedId = row.insertedId.toString();
		doc = this.setMemo(doc);
		
		if(config.smtp.enabled){
			//send notification to client
			doc = this.setMemoClient(doc);
			await this.mailing.send(doc);
			
			//send notification to admin
			doc = this.setMemoAdmin(doc);
			await this.mailing.send(doc); 
		}
		
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}



//@route('/ecommerce/transaction/:id')
//@method(['get'])
self.prototype.ecommerce_read = async function(req,res){
	try{
		//get params
		let params = (new Buffer(req.params.id,"base64")).toString();
		let isadmin = false;
		if(params.indexOf(":")>-1){
			isadmin = true;
			params = params.split(":");
		}else{
			params = [params];
		}
		
		//get document
		let row = await this.mongodb.findOne("ecommerce",params[0]);
		
		//finish
		res.render("ecommerce/transaction",{
			document:	row, 
			title:		this.workflow.on[row.status.toString()].title,
			message:	this.workflow.on[row.status.toString()].message,
			action:		config.properties.host + "/" + "ecommerce" + "/transaction/" + new Buffer((isadmin)?params[0] + ":" + params[0]:params[0]).toString("base64"),
			btn:		this.workflow.on[row.status.toString()][((isadmin)?"btnToAdmin":"btnToClient")],
			config:		config
		});
		
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}



//@route('/ecommerce/transaction/:id')
//@method(['post'])
self.prototype.ecommerce_update = async function(req,res){
	try{
		
		//recaptcha valid
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		
		//valid action
		let action = parseInt(req.body.action);
		if(this.workflow.status.indexOf(action)==-1){
			throw("La acción ejecutada no existe");
		}
		
		//get params
		let params = (new Buffer(req.params.id,"base64")).toString();
		let isadmin = false;
		if(params.indexOf(":")>-1){
			isadmin = true;
			params = params.split(":");
		}else{
			params = [params];
		}
		
		//get document
		let row = await this.mongodb.findOne("ecommerce",params[0]);
		
		//set document
		row.message += "<br>" + ((isadmin)?"Administrador":"Cliente") + ": " + req.body.message + " <small>" + (new Date()).toISOString() + "</small>";
		row.status = action;
		
		//cache on update
		let insertedId = row._id;
		
		//update
		await this.mongodb.updateOne("ecommerce",params[0],row);
		
		//config notification
		row.insertedId = params[0];
		row = this.setMemo(row);
		
		//send notification to client
		row = this.setMemoClient(row);
		await this.mailing.send(row);
		
		//send notification to admin
		row = this.setMemoAdmin(row);
		await this.mailing.send(row);
		
		//finish
		res.render("ecommerce/transaction",{
			document:	row, 
			title:		this.workflow.on[row.status.toString()].title,
			message:	this.workflow.on[row.status.toString()].message,
			action:		config.properties.host + "/" + "ecommerce" + "/transaction/" + new Buffer((isadmin)?params[0] + ":" + params[0]:params[0]).toString("base64"),
			btn:		this.workflow.on[row.status.toString()][((isadmin)?"btnToAdmin":"btnToClient")],
			config:		config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}



//@route('/ecommerce/:id')
//@method(['get'])
self.prototype.render_other = async function(req,res,next){
	let view = "ecommerce" + "/" + req.params.id;
	if(this.helper.exist(view)){
		res.render(view,{config: config});
	}else{
		return next();
	}
}





//@route('/api/ecommerce/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		const row = await this.mongodb.findOne("ecommerce",req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;