"use strict";

const fs = require("fs");
const path = require("path");

const self = function(a){
	this.dir = a.dir + "/app/frontend";
	this.disabled = ['img','@ionic','canvasjs-2.3.2','leaflet','angular','bootstrap','ckeditor','font-awesome','gojs','jquery','jquery-ui'];
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
//@roles(['root'])
self.prototype.code = function(req,res){
	res.send({data: 'Frontend' + '\n' + this.getDirectory(this.dir,"/",1)});
}

self.prototype.getDirectory = function(src, dirbase, spaces){
	
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
			if(this.disabled.indexOf(files[i])==-1){
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
	
		if(this.disabled.indexOf(folders[i])==-1){
			text += this.getDirectory(direct, dirbase + folders[i] + "/",spaces+1);
		}
	}
	
	return text;
};

module.exports = self;