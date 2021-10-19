"use strict";

const fs = require("fs");

const self = function(a){
	this.dir		= a.dir;
	this.helper		= a.helper;
	this.mailing	= a.mailing;
	this.mongodb	= a.mongodb;
	this.render 	= a.render;
}

//@route('/api/poll/total')
//@method(['get'])
//@roles(['root','admin','poll'])
self.prototype.total = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count("poll",query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/poll/collection')
//@method(['get'])
//@roles(['root','admin','poll'])
self.prototype.collection = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find("poll",query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/poll/users/tag')
//@method(['get'])
//@roles(['root','admin','poll'])
self.prototype.users_tag = async function(req,res){
	try{
		const data = await this.mongodb.distinct("user","roles");
		res.send({data: data.filter((r)=>{return r!='root'})});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/api/poll/users/:id')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.users_by_tag = async function(req,res){
	try{
		const q = {notification: true}
		if((req.params.id!='*')){
			q.roles = {$in: [req.params.id]};	
		}
		const data = await this.mongodb.find('user',q,{projection: {email: 1}});
		res.send({data: data});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/api/poll')
//@method(['post'])
//@roles(['root','admin','poll'])
self.prototype.create = async function(req,res){
	try{
		await this.mongodb.insertOne("poll",req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/poll/:id')
//@method(['get'])
//@roles(['root','admin','poll'])
self.prototype.read = async function(req,res){
	try{
		let row = await this.mongodb.findOne("poll",req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/poll/:id')
//@method(['put'])
//@roles(['root','admin','poll'])
self.prototype.update = async function(req,res){
	try{
		await this.mongodb.updateOne("poll",req.params.id,req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/poll/:id')
//@method(['delete'])
//@roles(['root','admin','poll'])
self.prototype.delete = async function(req,res){
	try{
		await this.mongodb.deleteOne("poll",req.params.id);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

//@route('/api/poll/start/:id')
//@method(['put'])
//@roles(['root','admin','poll'])
self.prototype.start = async function(req,res){
	try{
		
		//get document
		let row = await this.mongodb.findOne("poll",req.params.id);
		
		row.sent = [];
		row.answer = [];
		
		for(let i=0;i<row.accounts.length;i++){
			row.accounts[i] = row.accounts[i].trim();
			
			let hash = this.helper.toHash(row.accounts[i], row._id.toString());
			
			row.sent.push(hash);
			row.answer.push(null);
		}
		
		//update poll
		row.status = "Enviada";
		await this.mongodb.updateOne("poll",req.params.id,row);
		
		//finish
		res.send({data: true, row: row});
		
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

//@route('/api/poll/notify/:id/:to')
//@method(['put'])
//@roles(['root','admin','poll'])
self.prototype.notify = async function(req,res){
	try{
		
		//get document
		let row = await this.mongodb.findOne("poll",req.params.id);
		let to = req.params.to;
		let hash = this.helper.toHash(to, row._id.toString());
		
		//doc to mail/template
		let doc = {
			to: to,
			subject: row.title,
			poll: row,
			encode: config.properties.host + "/api/poll/" + row._id + "/answer/" + hash
		}
		
		//set template
		doc.html = this.render.processTemplateByPath(this.dir + config.properties.views + "poll/memo.poll.html", doc);
		
		//send memo
		await this.mailing.send(doc);
		
		//finish
		res.send({data: true, row: row});
		
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

//@route('/api/poll/:id/answer/:encode')
//@method(['get','post'])
self.prototype.answer = async function(req,res){
	try{
		
		//get document
		let row = await this.mongodb.findOne("poll",req.params.id);
		
		if(row.status!="Enviada"){
			throw("La votación ya no está disponible");
		}
		
		//get index of user account
		let indexof = row.sent.indexOf(req.params.encode);
		if(indexof==-1){
			throw("La codificación ingresada no corresponde");
		}
				
		switch(req.method){
			case "GET":
				if(row.answer[indexof]!=null){
					throw("Su solicitud ya ha sido procesada");
				}
				res.render("index",{
					...this.helper.toRender(req),
					onOpen: {
						app: "poll", 
						action: "answer", 
						data: {
							poll: {
								title: row.title, 
								content: row.content,
								option:row.options
							}, 
							action: config.properties.host +"/api/poll/" + row._id + "/answer/" + req.params.encode
						}
					}
				});
			break;
			case "POST":
				row.answer[indexof] = req.body.option;
				await this.mongodb.updateOne("poll",req.params.id,row);
				const ext = (row.private)?"":" Para ver los resultados ingrese <a href='/api/poll/" + req.params.id + "/result'>aquí</a>";
				this.helper.renderMessage(req,res,'Encuesta ' + row.title,'Muchas gracias por haber respondido. ' + ext);
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

//@route('/api/poll/:id/answer')
//@method(['get','post'])
self.prototype.answer_anon = async function(req,res){
	try{
		
		//get document
		let row = await this.mongodb.findOne("poll",req.params.id);
		
		if(row.status!="Enviada"){
			throw("La votación ya no está disponible");
		}
		
		if(!row.anon){
			throw("La votación no está disponible");
		}
		
		switch(req.method){
			case "GET":
				res.render("index",{
					...this.helper.toRender(req), 
					onOpen: {
						app: "poll", 
						action: "answer", 
						data: {
							poll: {
								title: row.title, 
								content: row.content,
								option:row.options
							}, 
							action: config.properties.host +"/api/poll/" + row._id + "/answer/"
						}
					}
				});
			break;
			case "POST":
				row.anons.push(req.body.option);
				await this.mongodb.updateOne("poll",req.params.id,row);
				let ext = (row.private)?"":" Para ver los resultados ingrese <a href='/api/poll/" + req.params.id + "/result'>aquí</a>";
				this.helper.renderMessage(req,res,'Encuesta ' + row.title,'Muchas gracias por haber respondido. ' + ext);
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

//@route('/api/poll/:id/result')
//@method(['get'])
self.prototype.result = async function(req,res){
	try{
		const row = await this.mongodb.findOne("poll",req.params.id);
		if(row.private && (req.user==undefined || req.user.roles.indexOf("root")==-1)){
			throw("Los resultados son privados");
		}
		
		res.render("index",{
			...this.helper.toRender(req), 
			onOpen: {
				app: "poll", 
				action: "result", 
				data: {content: row.content, answer: row.answer, anons: row.anons}
			}
		});
		
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}

//@route('/poll')
//@method(['get'])
//@roles(['root','admin','poll'])
self.prototype.render_ = async function(req,res,next){
	res.render("poll/index");
}

module.exports = self;