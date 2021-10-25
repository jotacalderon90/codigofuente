"use strict";

const fs = require('fs');
const path = require("path");
const mailing = require('./lib/mailing');
const mongodb = require('./lib/mongodb');
const render = require('./lib/render');

const self = function(a){
	this.path_templates = config.dir + '/frontend/app/mailing/';
}

self.prototype.getMetadata = function(template){
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

//@route('/api/mailing/templates')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.templates = async function(req,res){
	try{
		const data = fs.readdirSync(this.path_templates,"utf8").filter((row)=>{
			return fs.statSync(path.join(this.path_templates,row)).isFile() && row.indexOf('memo.')==0;
		});
		res.send({data: data.map((r)=>{return r.split('.')[1]})});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/api/mailing/templates/:id')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.template_metadata = async function(req,res){
	try{
		res.send({data: this.getMetadata(fs.readFileSync(this.path_templates + 'memo.' + req.params.id + '.html',"utf8"))});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/mailing/templates/:id')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.render_template = async function(req,res){
	res.send(render.process("mailing/memo." + req.params.id + ".html",req.body));
}

//@route('/api/mailing/users/tag')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.users_tag = async function(req,res){
	try{
		const data = await mongodb.distinct("user","roles");
		res.send({data: data.filter((r)=>{return r!='root'})});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/api/mailing/users/:id')
//@method(['get'])
//@roles(['root','admin'])
self.prototype.users_by_tag = async function(req,res){
	try{
		const q = {notification: true}
		if((req.params.id!='*')){
			q.roles = {$in: [req.params.id]};	
		}
		const data = await mongodb.find('user',q,{projection: {email: 1,nickname: 1}});
		res.send({data: data});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/api/mailing/message')
//@method(['post'])
//@roles(['root','admin'])
self.prototype.message = async function(req,res){
	try{
		
		const d = await mongodb.insertOne('mailing',req.body);
		req.body.pxmagico = d.insertedId.toString();
		
		if(req.body.template){
			req.body.html = render.process("mailing/memo." + req.body.template + ".html",req.body);
			await mongodb.updateOne('mailing',req.body.pxmagico,{$set: {html: req.body.html}});
		}
		
		await mailing.send(req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

//@route('/assets/media/img/pxmagico.png')
//@method(['get'])
self.prototype.pxmagico = async function(req,res){
	try{
		if(req.query.data){
			mongodb.updateOne('mailing',req.query.data,{$set: {view: true}});
		}
		res.sendFile(config.dir + '/frontend/assets/media/img/px.png','utf8');
	}catch(e){
		res.send({data: null, error: e});
	}
}

module.exports = new self();