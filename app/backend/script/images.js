const fs = require('fs');
const request = require('request');
global.config = JSON.parse(fs.readFileSync("../../../app.json","utf8"));
const mongodb = new (require("../lib/mongodb"))();

const self = function(){
	this.start();
}

self.prototype.start = async function(){
	try{
		await mongodb.start();
		let data = await mongodb.find("story");
		for(let i=0;i<data.length;i++){
			try{
				console.log( (i+1) + "/" + data.length);
				if(data[i].img.indexOf("/assets/media/img/story/")===-1){
					let ct = await this.validImage(data[i].img);
				
					let path = "../../frontend/assets/media/img/story/" + data[i]._id + "." + this.getExt(ct);				
					await this.downloadImage(data[i].img, path);
					
					let path2 = "/assets/media/img/story/" + data[i]._id + "." + this.getExt(ct);
					await mongodb.updateOne("story",data[i]._id,{$set: {img: path2}})
				}
			}catch(e){
				console.log(e);
			}
		}
		process.exit(0);
	}catch(e){
		console.error(e);
	}
}

self.prototype.start_backup_blog = async function(){
	try{
		await mongodb.start();
		let data = await mongodb.find("blog");
		for(let i=0;i<data.length;i++){
			try{
				console.log( (i+1) + "/" + data.length);
				if(data[i].thumb.indexOf("/assets/media/img/blog/")===-1){
					let ct = await this.validImage(data[i].thumb);
				
					let path = "../../frontend/assets/media/img/blog/" + data[i]._id + "." + this.getExt(ct);				
					await this.downloadImage(data[i].thumb, path);
					
					let path2 = "/assets/media/img/blog/" + data[i]._id + "." + this.getExt(ct);
					await mongodb.updateOne("blog",data[i]._id,{$set: {thumb: path2, img: path2}})
				}
			}catch(e){
				console.log(e);
			}
		}
		process.exit(0);
	}catch(e){
		console.error(e);
	}
}

self.prototype.validImage = function(uri){
	return new Promise((resolve,reject)=>{
		request.head(uri, function(error, res, body){
			if(error){
				return reject(error);
			}else if(res.headers['content-type']===undefined){
				return reject(undefined);
			}else{
				if(	res.headers['content-type'].indexOf("undefined")>-1 ||
					res.headers['content-type'].indexOf("text/html")>-1
				){
					return reject("invalid content type " + res.headers['content-type']);
				}else{
					resolve(res.headers['content-type']);
				}
			}
		});
	});
};

self.prototype.getExt = function(ct){
	switch(ct){
		case "image/png":
		return "png";
		break;
		case "image/jpeg":
		return "jpg";
		break;
		case "image/gif":
		return "gif";
		break;
	}
}

self.prototype.downloadImage = function(uri,filename){
	return new Promise((resolve,reject)=>{
		request(uri).pipe(fs.createWriteStream(filename)).on('close', function(){
			resolve();
		});
	});
}

new self();
/*

var download = function

download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
  console.log('done');
});*/



