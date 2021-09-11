"use strict";

const io = require("socket.io");

const self = function(a){
	//this.push = a.push;
	this.helper = a.helper;
	this.server = io(a.server);
	this.cont = 0;
	this.server.on("connection", (socket)=>{this.connection(socket)});
}

self.prototype.connection = function(socket){
	socket.on("mts", (data)=>{this.mts(data)});
	socket.on("mta", (data)=>{this.mta(data)});
	socket.on("disconnect", ()=>{this.disconnect(socket.request.connection.remoteAddress)});
	for(let i=0;i<this.helper.socket_methods.length;i++){
		let method_name = this.helper.socket_methods[i][0];
		let class_name = this.helper.socket_methods[i][1];
		socket.on(method_name, (data)=>{class_name[method_name](data)});
	}
	console.log("socket.connection:" + socket.request.connection.remoteAddress);
	this.cont++;
}

self.prototype.mts = function(data){
	let d = {};
	try{
		d.msg = data.msg;
		d.time = new Date();
		this.server.sockets.emit("mtc", d);
		//this.push.notificateToAdmin("new socket mts",data.msg);
	}catch(e){
		console.error(e);
	}
}

self.prototype.mta = function(data){
	let d = {};
	try{
		d.msg = data.msg;
		d.time = new Date();
		//this.push.notificateToAdmin("new socket mta",data.msg);
	}catch(e){
		console.error(e);
	}
}

self.prototype.disconnect = function(socket){
	console.log("socket.disconnect:" + socket);
	this.cont--;
}

module.exports = self;