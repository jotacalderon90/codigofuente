"use strict";

const fs = require("fs");
const helper = require('./lib/helper');
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const render = require('./lib/render');
const logger = require('./lib/log')('route.poll');

module.exports = {
	total: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			let total = await mongodb.count("poll",query);
			res.send({data: total});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
			let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
			let data = await mongodb.find("poll",query,options);
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	users_tag: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			const data = await mongodb.distinct("user","roles");
			res.send({data: data.filter((r)=>{return r!='root'})});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	users_by_tag: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			const q = {notification: true}
			if((req.params.id!='*')){
				q.roles = {$in: [req.params.id]};	
			}
			const data = await mongodb.find('user',q,{projection: {email: 1}});
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			await mongodb.insertOne("poll",req.body);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	read: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			let row = await mongodb.findOne("poll",req.params.id);
			res.send({data: row});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			await mongodb.updateOne("poll",req.params.id,req.body);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			await mongodb.deleteOne("poll",req.params.id);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	start: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			//get document
			let row = await mongodb.findOne("poll",req.params.id);
			
			row.sent = [];
			row.answer = [];
			
			for(let i=0;i<row.accounts.length;i++){
				row.accounts[i] = row.accounts[i].trim();
				
				let hash = helper.toHash(row.accounts[i], row._id.toString());
				
				row.sent.push(hash);
				row.answer.push(null);
			}
			
			//update poll
			row.status = "Enviada";
			await mongodb.updateOne("poll",req.params.id,row);
			
			//finish
			res.send({data: true, row: row});
			
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	notify: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','poll'])){throw(401);}
			
			//get document
			let row = await mongodb.findOne("poll",req.params.id);
			let to = req.params.to;
			let hash = helper.toHash(to, row._id.toString());
			
			//doc to mail/template
			let doc = {
				to: to,
				subject: row.title,
				poll: row,
				encode: config.properties.host + "/api/poll/" + row._id + "/answer/" + hash
			}
			
			//set template
			doc.html = render.process("poll/memo.poll.html", doc);
			
			//send memo
			await mailing.send(doc);
			
			//finish
			res.send({data: true, row: row});
			
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	answer: async function(req,res){
		try{
			
			//get document
			let row = await mongodb.findOne("poll",req.params.id);
			
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
						...helper.toRender(req),
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
					await mongodb.updateOne("poll",req.params.id,row);
					const ext = (row.private)?"":" Para ver los resultados ingrese <a href='/api/poll/" + req.params.id + "/result'>aquí</a>";
					helper.renderMessage(req,res,'Encuesta ' + row.title,'Muchas gracias por haber respondido. ' + ext);
				break;
			}
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	answer_anon: async function(req,res){
		try{
			
			//get document
			let row = await mongodb.findOne("poll",req.params.id);
			
			if(row.status!="Enviada"){
				throw("La votación ya no está disponible");
			}
			
			if(!row.anon){
				throw("La votación no está disponible");
			}
			
			switch(req.method){
				case "GET":
					res.render("index",{
						...helper.toRender(req), 
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
					await mongodb.updateOne("poll",req.params.id,row);
					let ext = (row.private)?"":" Para ver los resultados ingrese <a href='/api/poll/" + req.params.id + "/result'>aquí</a>";
					helper.renderMessage(req,res,'Encuesta ' + row.title,'Muchas gracias por haber respondido. ' + ext);
				break;
			}
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	result: async function(req,res){
		try{
			const row = await mongodb.findOne("poll",req.params.id);
			if(row.private && (req.user==undefined || req.user.roles.indexOf("root")==-1)){
				throw("Los resultados son privados");
			}
			
			res.render("index",{
				...helper.toRender(req), 
				onOpen: {
					app: "poll", 
					action: "result", 
					data: {content: row.content, answer: row.answer, anons: row.anons}
				}
			});
			
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}