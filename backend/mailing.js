"use strict";

const fs = require('fs');
const path = require("path");
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const render = require('./lib/render');
const helper = require('./lib/helper');
const logger = require('./lib/log')('route.mailing');

const directory = config.dir + '/frontend/app/mailing/';

const getMetadata = function(template){
	const rows = [];
	while(template.indexOf("{{")>-1){
		const index1 = template.indexOf("{{");
		const tmp = template.substring(index1);
		const index2 = tmp.indexOf("}}");
		const tempTemplate = tmp.substring(2,index2);
		rows.push({label: tempTemplate.replace("data:doc.","") ,name: tempTemplate,type: "static", value: ""});
		template = template.split("{{"+tempTemplate+"}}").join("metadata");
	}
	return rows;
}

module.exports = {
	templates: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const data = fs.readdirSync(directory,"utf8").filter((row)=>{
				return fs.statSync(path.join(directory,row)).isFile() && row.indexOf('memo.')==0;
			});
			res.send({data: data.map((r)=>{return r.split('.')[1]})});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	template_metadata: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			res.send({data: getMetadata(fs.readFileSync(directory + 'memo.' + req.params.id + '.html',"utf8"))});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	render_template: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			res.send(render.process("mailing/memo." + req.params.id + ".html",req.body));
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	users_tag: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
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
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const q = {notification: true}
			if((req.params.id!='*')){
				q.roles = {$in: [req.params.id]};	
			}
			const data = await mongodb.find('user',q,{projection: {email: 1,nickname: 1}});
			res.send({data: data});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	message: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const d = await mongodb.insertOne('mailing',req.body);
			req.body.pxmagico = d.insertedId.toString();
			
			if(req.body.template){
				req.body.html = render.process("mailing/memo." + req.body.template + ".html",req.body);
				await mongodb.updateOne('mailing',req.body.pxmagico,{$set: {html: req.body.html}});
			}
			
			await mailing.send(req.body);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	pxmagico: async function(req,res){
		try{
			if(req.query.data && req.query.data!='undefined'){
				mongodb.updateOne('mailing',req.query.data,{$set: {view: true}});
			}
			res.sendFile(config.dir + '/frontend/assets/media/img/px.png','utf8');
		}catch(e){
			helper.onError(req,res,e);
		}
	}
};