"use strict";
/*
const WebSocketServer = require('websocket').server;

const self = function(a){
	this.helper = a.helper;
	this.connections = [];
	this.wsServer = new WebSocketServer({httpServer: a.server,autoAcceptConnections: false});
	this.wsServer.on('request', (request)=>{this.request(request)});
	
}

self.prototype.originIsAllowed = function(origin){
	console.log('originIsAllowed');
	console.log(origin);
	return true;
}

self.prototype.request = function(request){
	if (!this.originIsAllowed(request.origin)) {
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}
	this.connections.push(request.accept('echo-protocol', request.origin));
	const c = this.connections[this.connections.length-1];
	c.on('message',(message)=>{this.message(c,message)});
	c.on('close',(reasonCode, description)=>{this.close(c,reasonCode, description)});
}

self.prototype.message = function(connection,message){
	if (message.type === 'utf8') {
		try{
			const j = JSON.parse(message.utf8Data);
			j.time = new Date();
			if(j.toAll){
				for(let i=0;i<this.connections.length;i++){
					this.connections[i].sendUTF(JSON.stringify(j));
				}
			}else{
				connection.sendUTF(JSON.stringify(j));
			}
		}catch(e){
			console.log('rest.lib.socket.message');
			console.log(e);
		}		
	} else if (message.type === 'binary') {
		console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
		connection.sendBytes(message.binaryData);
	}
}

self.prototype.close = function(connection, reasonCode, description){
	console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
}

self.prototype.mts = function(data){
	this.server.sockets.emit("mtc", {msg: data.msg, time: new Date()});
}
module.exports = self;
*/
module.exports = function(){
	
}