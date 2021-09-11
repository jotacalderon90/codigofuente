"use strict";

const fs = require("fs");
const path = require("path");

const self = function(a){
	this.helper = a.helper;
	this.dir = a.dir + "/";
}



self.prototype.decode = function(value){
	return decodeURIComponent(new Buffer(value,"base64"));
}



//@route('/directory')
//@method(['get'])
//@roles(['root'])
self.prototype.render = async function(req,res){
	res.render("index",{...this.helper.toRender(req), onOpen: {app: "directory", action: "open", data: null}});
}




//@route('/api/folder/full')
//@method(['get'])
//@roles(['root'])
self.prototype.fullDirectory = function(req,res){
	try{
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
		res.send({data: getDirectory(this.dir,"/")});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/folder/:id/total')
//@method(['get'])
//@roles(['root'])
self.prototype.total = function(req,res){
	try{
		let dir = this.dir + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return !fs.statSync(path.join(dir,row)).isFile();
		}).length;
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/folder/:id/collection')
//@method(['get'])
//@roles(['root'])
self.prototype.collection = function(req,res){
	try{
		let dir = this.dir + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return !fs.statSync(path.join(dir,row)).isFile();
		});
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/folder/:id')
//@method(['post'])
//@roles(['root'])
self.prototype.create = function(req,res){
	try{
		fs.mkdirSync(this.dir + this.decode(req.params.id) + req.body.name);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/folder/:id')
//@method(['put'])
//@roles(['root'])
self.prototype.update = function(req,res){
	try{
		fs.renameSync(this.dir + this.decode(req.params.id), this.dir + "/" + req.body.name);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/folder/:id')
//@method(['delete'])
//@roles(['root'])
self.prototype.delete = function(req,res){
	try{
		fs.rmdirSync(this.dir + this.decode(req.params.id));
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id/total')
//@method(['get'])
//@roles(['root'])
self.prototype.file_total = function(req,res){
	try{
		let dir = this.dir + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return fs.statSync(path.join(dir,row)).isFile();
		}).length;
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id/collection')
//@method(['get'])
//@roles(['root'])
self.prototype.file_collection = function(req,res){
	try{
		let dir = this.dir + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return fs.statSync(path.join(dir,row)).isFile();
		});
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id')
//@method(['post'])
//@roles(['root'])
self.prototype.file_create = function(req,res){
	try{
		fs.writeFileSync(this.dir + this.decode(req.params.id) + req.body.name, (req.body.content)?req.body.content:"");
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id')
//@method(['get'])
//@roles(['root'])
self.prototype.file_read = function(req,res){
	try{
		res.send({data: fs.readFileSync(this.dir + this.decode(req.params.id),"utf8")});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id')
//@method(['put'])
//@roles(['root'])
self.prototype.file_update = function(req,res){
	try{
		fs.writeFileSync(this.dir + this.decode(req.params.id), req.body.content);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id')
//@method(['delete'])
//@roles(['root'])
self.prototype.file_delete = function(req,res){
	try{
		fs.unlinkSync(this.dir + this.decode(req.params.id));
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id/rename')
//@method(['put'])
//@roles(['root'])
self.prototype.file_rename = function(req,res){
	try{
		fs.renameSync(this.dir + this.decode(req.params.id),this.dir + "/" + req.body.name);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/file/:id/download')
//@method(['get'])
//@roles(['root'])
self.prototype.file_download = function(req,res){
	try{
		res.download(this.dir + this.decode(req.params.id));
	}catch(e){
		res.send({data: null, error: e});
	}
}



//@route('/api/file/:id/getfile')
//@method(['get'])
//@roles(['root'])
self.prototype.file_get = function(req,res){
	try{
		res.sendFile(this.dir + this.decode(req.params.id));
	}catch(e){
		res.send({data: null, error: e});
	}
}



//@route('/api/file/:id/uploader')
//@method(['post'])
//@roles(['root'])
self.prototype.file_upload = async function(req,res){
	try{
		if (!req.files || Object.keys(req.files).length === 0) {
			throw("no file");
		}
		
		let dir = this.dir + (this.decode(req.params.id)).substr(1);
		
		if(Array.isArray(req.files.file)){
			for(let i=0;i<req.files.file.length;i++){
				console.log("subiendo archivo" + req.files.file[i].name);
				await this.upload_process(req.files.file[i], dir + req.files.file[i].name);
			}
		}else{
			console.log("subiendo archivo" + req.files.file.name);
			await this.upload_process(req.files.file, dir + req.files.file.name);
		}
		
		//res.send({data: true});
		res.redirect("/directory");
	}catch(e){
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
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
module.exports = self;