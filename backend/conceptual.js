"use strict";

const fs = require("fs");
const path = require("path");
const helper = require('./lib/helper');
const logger = require('./lib/log')('route.conceptual');

const directory = config.dir + "/frontend";
const disabled = ['img','@ionic','canvasjs-2.3.2','leaflet','timeliner-2.31','angular','bootstrap','ckeditor','font-awesome','gojs','jquery','jquery-ui'];

const getDirectory = function(src, dirbase, spaces){
	
	const files = fs.readdirSync(src,"utf8").filter(function(row){
		return fs.statSync(path.join(src,row)).isFile();
	});
		
	const folders = fs.readdirSync(src,"utf8").filter(function(row){
		return !fs.statSync(path.join(src,row)).isFile();
	});
	
	let text = '';
	
	if(files.length > 0){	
		for(let s=0;s<spaces;s++){
			text += '\t';
		}		
		const f = [];
		for(let i=0;i<files.length;i++){
			if(disabled.indexOf(files[i])==-1){
				f.push(files[i]);
			}
		}
		text += f.join(',') + '\n';	
	}
	
	for(let i=0;i<folders.length;i++){
		
		const direct = path.join(src, folders[i]);
		
		for(let s=0;s<spaces;s++){
			text += '\t';
		}
			
		text += folders[i] + '\n';
	
		if(disabled.indexOf(folders[i])==-1){
			text += getDirectory(direct, dirbase + folders[i] + "/",spaces+1);
		}
	}
	
	return text;
};

const self = function(){
}

/*service string to go data
//@route('/api/conceptual/convert')
//@method(['post'])
*/
self.prototype.convert = async function(req,res){
	try{
		let r = [];
		let c = req.body.string;
		c = c.split("\n");
		let parent;
		for(let i=0;i<c.length;i++){
			if(c[i].trim()!=""){
				let d = {};
				d.key = i;
				d.name = c[i].trim();
				d.name = (d.name.indexOf(",")==-1)?d.name:d.name.split(",").join("\n");
				
				let ct = c[i].split("\t").length-1;
				
				if(ct==0){
					parent = i;
				}else{
					d.parent = null;
					let p = 1;
					while(d.parent==null){
						let ct2 = c[i-p].split("\t").length-1;
						let anterior = r[r.length-p];
						if(ct>ct2){
							d.parent = anterior.key;
						}else{
							p++;
						}
					}
				}
				r.push(d);
			}
		}
		res.json({data: r});
	}catch(e){
		res.json({data: null,error: e});
	}
}

//@route('/api/conceptual/code')
//@method(['get'])
self.prototype.code = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root'])){throw(401);}
		res.send({data: 'Frontend' + '\n' + getDirectory(directory,"/",1)});
	}catch(e){
		helper.onError(req,res,e);
	}
}

module.exports = new self();