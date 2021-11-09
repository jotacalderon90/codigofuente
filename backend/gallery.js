"use strict";

const fs = require("fs");
const path = require("path");
const helper = require('./lib/helper');
const logger = require('./lib/log')('route.gallery');

const frontpath = '/assets/media/img/gallery/';
const directory = config.dir + "/frontend" + frontpath;

module.exports = {
	collection: async function(req,res){
		try{
			const r = fs.readdirSync(directory,"utf8").filter((row)=>{
				return !fs.statSync(path.join(directory,row)).isFile();
			});
			res.send({data: r});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','gallery'])){throw(401);}
			
			fs.mkdirSync(directory + req.body.title);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','gallery'])){throw(401);}
			
			fs.renameSync(directory + req.params.id, directory + req.body.title);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','gallery'])){throw(401);}
			
			fs.rmdirSync(directory + req.params.id, {recursive: true});
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection_file: async function(req,res){
		try{
			const r = fs.readdirSync(directory + req.params.id,"utf8").filter((row)=>{
				return fs.statSync(path.join(directory + req.params.id,row)).isFile();
			});
			res.send({data: r.map((r)=>{return frontpath + req.params.id + '/' + r})});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	upload_file: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','gallery'])){throw(401);}
			
			if (!req.files || Object.keys(req.files).length === 0) {
				throw("no file");
			}
			
			if(Array.isArray(req.files.file)){
				for(let i=0;i<req.files.file.length;i++){
					await helper.upload_process(req.files.file[i], directory + req.params.id + '/' + req.files.file[i].name);
				}
			}else{
				await helper.upload_process(req.files.file, directory + req.params.id + '/' + req.files.file.name);
			}
			
			res.redirect("/");
			
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete_file: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','gallery'])){throw(401);}
			
			fs.unlinkSync(directory + req.params.id + '/' + req.params.file);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}