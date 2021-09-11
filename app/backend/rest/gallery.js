"use strict";

const fs = require("fs");
const path = require("path");

const self = function(a){
	this.frontpath = '/assets/media/img/gallery/';
	this.dir = a.dir + "/app/frontend" + this.frontpath;
	this.helper = a.helper;
}



/*index
//@route('/gallery')
//@method(['get'])
*/
self.prototype.index = function(req,res,next){
	res.render("index",{...this.helper.toRender(req), onOpen: {app: "gallery", action: "open"}});
}



//@route('/api/gallery/collection')
//@method(['get'])
self.prototype.collection = function(req,res){
	try{
		const r = fs.readdirSync(this.dir,"utf8").filter((row)=>{
			return !fs.statSync(path.join(this.dir,row)).isFile();
		});
		res.send({data: r});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/gallery')
//@method(['post'])
//@roles(['root','admin','gallery'])
self.prototype.create = function(req,res){
	try{
		fs.mkdirSync(this.dir + req.body.title);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/gallery/:id')
//@method(['put'])
//@roles(['root','admin','gallery'])
self.prototype.update = function(req,res){
	try{
		fs.renameSync(this.dir + req.params.id, this.dir + req.body.title);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/gallery/:id')
//@method(['delete'])
//@roles(['root','admin','gallery'])
self.prototype.delete = function(req,res){
	try{
		fs.rmdirSync(this.dir + req.params.id, {recursive: true});
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/gallery/:id/collection')
//@method(['get'])
self.prototype.collection_file = function(req,res){
	try{
		const r = fs.readdirSync(this.dir + req.params.id,"utf8").filter((row)=>{
			return fs.statSync(path.join(this.dir + req.params.id,row)).isFile();
		});
		res.send({data: r.map((r)=>{return this.frontpath + req.params.id + '/' + r})});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/gallery/:id/uploader')
//@method(['post'])
//@roles(['root','admin','gallery'])
self.prototype.upload_file = async function(req,res){
	try{
		if (!req.files || Object.keys(req.files).length === 0) {
			throw("no file");
		}
		
		if(Array.isArray(req.files.file)){
			for(let i=0;i<req.files.file.length;i++){
				console.log("subiendo archivo" + req.files.file[i].name);
				await this.helper.upload_process(req.files.file[i], this.dir + req.params.id + '/' + req.files.file[i].name);
			}
		}else{
			console.log("subiendo archivo" + req.files.file.name);
			await this.helper.upload_process(req.files.file, this.dir + req.params.id + '/' + req.files.file.name);
		}
		
		//res.send({data: true});
		res.redirect("/gallery");
	}catch(e){
		console.log(e);
		res.status(500).render("index",this.helper.toRenderError(req,e));
	}
}



//@route('/api/gallery/:id/:file')
//@method(['delete'])
//@roles(['root','admin','gallery'])
self.prototype.delete_file = function(req,res){
	try{
		fs.unlinkSync(this.dir + req.params.id + '/' + req.params.file);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}



module.exports = self;