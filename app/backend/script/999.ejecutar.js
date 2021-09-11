"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
}

/*update object in collection
//@route('/EJECUTAR')
//@method(['get'])
//@roles(['admin'])
*/
self.prototype.EJECUTAR = async function(req,res){
	try{
		let data = await this.mongodb.find("map",{});
		for(let i=0;i<data.length;i++){
			console.log(i+"/"+data.length);
			await this.mongodb.updateOne("story",data[i].STORY,{$set: {"lat":data[i].LAT,"lng":data[i].LNG,"audio":data[i].AUDIO}});
		}
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



module.exports = self;