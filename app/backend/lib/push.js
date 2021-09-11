"use strict";

const fs = require("fs");
const webpush = require('web-push');

const self = function(a){
	if(!a.config.push){
		const vapidKeys = webpush.generateVAPIDKeys();
		a.config.push = {
			public: vapidKeys.publicKey,
			private: vapidKeys.privateKey
		}
		fs.writeFileSync(a.dir + "/app/backend/config/app.json",JSON.stringify(a.config,undefined,"\t"));
	}
	webpush.setVapidDetails(
		'mailto:' + a.config.properties.admin,
		a.config.push.public,
		a.config.push.private
	);
	this.publicKey = a.config.push.public;
	this.mongodb = a.mongodb;
}

self.prototype.send = async function(push,data){
	webpush.sendNotification(push, JSON.stringify(data));
}

self.prototype.notificateToAdmin = async function(title,body,uri){
	try{
		const rows = await this.mongodb.find("user",{roles: {$in: ["root","admin"]}, push: {$exists: true}});
		for(let i=0;i<rows.length;i++){
			for(let x=0;x<rows[i].push.length;x++){
				const push = await this.mongodb.findOne("push",rows[i].push[x]);
				this.send(push,{title: title, body: body, uri: uri});
			}
		}
	}catch(e){
		console.error(e);
	}
}

module.exports = self;