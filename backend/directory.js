"use strict";

const fs = require("fs");
const path = require("path");

const logger = require('./lib/log')('route.directory');
const helper = require('./lib/helper');

const directory = config.dir + "/";

const decode = function(value){
	return decodeURIComponent(new Buffer(value,"base64"));
}

module.exports = {
	fullDirectory: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			let getDirectory = function(src, dirbase){
				let tmpDir = fs.readdirSync(src);
				let directory = [];
				for(let i=0;i<tmpDir.length;i++){
					let direct = path.join(src, tmpDir[i]);
					let dir = {text: tmpDir[i], id: dirbase + tmpDir[i], type: (fs.statSync(direct).isDirectory())?"folder":"file"}
					if(fs.statSync(direct).isDirectory()){
						dir.children = getDirectory(direct, dirbase + tmpDir[i] + "/");
					}
					directory.push(dir);
				}
				return directory;
			};
			res.send({data: getDirectory(directory,"/")});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	total: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			let dir = directory + decode(req.params.id);
			let response = fs.readdirSync(dir,"utf8").filter(function(row){
				return !fs.statSync(path.join(dir,row)).isFile();
			}).length;
			res.send({data: response});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	collection: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			let dir = directory + decode(req.params.id);
			let response = fs.readdirSync(dir,"utf8").filter(function(row){
				return !fs.statSync(path.join(dir,row)).isFile();
			});
			res.send({data: response});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.mkdirSync(directory + decode(req.params.id) + req.body.name);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.renameSync(directory + decode(req.params.id), directory + "/" + req.body.name);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.rmdirSync(directory + decode(req.params.id));
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_total: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			let dir = directory + decode(req.params.id);
			let response = fs.readdirSync(dir,"utf8").filter(function(row){
				return fs.statSync(path.join(dir,row)).isFile();
			}).length;
			res.send({data: response});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_collection: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			let dir = directory + decode(req.params.id);
			let response = fs.readdirSync(dir,"utf8").filter(function(row){
				return fs.statSync(path.join(dir,row)).isFile();
			});
			res.send({data: response});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_create: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.writeFileSync(directory + decode(req.params.id) + req.body.name, (req.body.content)?req.body.content:"");
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_read: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			res.send({data: fs.readFileSync(directory + decode(req.params.id),"utf8")});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_update: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.writeFileSync(directory + decode(req.params.id), req.body.content);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_delete: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.unlinkSync(directory + decode(req.params.id));
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_rename: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			fs.renameSync(directory + decode(req.params.id),directory + "/" + req.body.name);
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_download: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			res.download(directory + decode(req.params.id));
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_get: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			res.sendFile(directory + decode(req.params.id));
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	file_upload: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
			
			if (!req.files || Object.keys(req.files).length === 0) {
				throw("no file");
			}
			
			let dir = directory + (decode(req.params.id)).substr(1);
			
			if(Array.isArray(req.files.file)){
				for(let i=0;i<req.files.file.length;i++){
					await helper.upload_process(req.files.file[i], dir + req.files.file[i].name);
				}
			}else{
				await helper.upload_process(req.files.file, dir + req.files.file.name);
			}
			
			res.redirect("/directory");
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}