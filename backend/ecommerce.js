"use strict";

const fs = require("fs");
const helper = require('./lib/helper');
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const render = require('./lib/render');

const self = function(a){
	this.setWorkflow("ecommerce");
}

self.prototype.setWorkflow = async function(name){
	try{
		this.workflow = await mongodb.find("workflow",{name: name});
		this.workflow = this.workflow[0];
	}catch(e){
		console.log(e);
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
	doc.html = render.process("ecommerce/memo.html",doc);
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
	doc.html = render.process("ecommerce/memo.html",doc);
	return doc;
}

//@route('/ecommerce/transaction')
//@method(['post'])
self.prototype.ecommerce_create = async function(req,res){
	try{

		//valid email
		if(!helper.isEmail(req.body.email)){ throw("El email ingresado no es válido");}
		
		//recaptcha valid
		await helper.recaptcha(req);
		
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
		let row = await mongodb.insertOne("ecommerce",doc);
		
		//config notification
		doc.insertedId = row.insertedId.toString();
		doc = this.setMemo(doc);
		
		if(config.smtp.enabled){
			//send notification to client
			doc = this.setMemoClient(doc);
			await mailing.send(doc);
			
			//send notification to admin
			doc = this.setMemoAdmin(doc);
			await mailing.send(doc); 
		}
		
		res.send({data: true});
	}catch(e){
		helper.onError(req,res,e);
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
		let row = await mongodb.findOne("ecommerce",params[0]);
		
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
		helper.onError(req,res,e);
	}
}

//@route('/ecommerce/transaction/:id')
//@method(['post'])
self.prototype.ecommerce_update = async function(req,res){
	try{
		
		//recaptcha valid
		await helper.recaptcha(req);
		
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
		let row = await mongodb.findOne("ecommerce",params[0]);
		
		//set document
		row.message += "<br>" + ((isadmin)?"Administrador":"Cliente") + ": " + req.body.message + " <small>" + (new Date()).toISOString() + "</small>";
		row.status = action;
		
		//cache on update
		let insertedId = row._id;
		
		//update
		await mongodb.updateOne("ecommerce",params[0],row);
		
		//config notification
		row.insertedId = params[0];
		row = this.setMemo(row);
		
		//send notification to client
		row = this.setMemoClient(row);
		await mailing.send(row);
		
		//send notification to admin
		row = this.setMemoAdmin(row);
		await mailing.send(row);
		
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
		helper.onError(req,res,e);
	}
}

//@route('/api/ecommerce/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		const row = await mongodb.findOne("ecommerce",req.params.id);
		res.send({data: row});
	}catch(e){
		helper.onError(req,res,e);
	}
}

module.exports = new self();