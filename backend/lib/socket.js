"use strict";

const io = require("socket.io");
const logger = require('./log')('lib.socket');

const self = function(){

}

self.prototype.load = function(server){
	this.server = io(server);
	this.cont = 0;
	this.server.on("connection", (socket)=>{this.connection(socket)});
}

self.prototype.connection = function(socket){
	socket.on("mts", (data)=>{this.mts(data)});
	socket.on("mta", (data)=>{this.mta(data)});
	socket.on("disconnect", ()=>{this.disconnect(socket.request.connection.remoteAddress)});
	logger.info(socket.request.connection.remoteAddress + ' connected');
	this.cont++;
}

self.prototype.mts = function(data){
	let d = {};
	try{
		d.msg = data.msg;
		d.time = new Date();
		this.server.sockets.emit("mtc", d);
	}catch(e){
		logger.info('mts');
		logger.info(e);
	}
}

self.prototype.mta = function(data){
	let d = {};
	try{
		d.msg = data.msg;
		d.time = new Date();
	}catch(e){
		logger.info('mta');
		logger.info(e);
	}
}

self.prototype.disconnect = function(socket){
	logger.info(socket + " disconnected");
	this.cont--;
}

module.exports = new self();