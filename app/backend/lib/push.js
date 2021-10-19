"use strict";

const fs = require("fs");
const webpush = require('web-push');

const self = function(a){
	
	let publicKey,privateKey;
	
	if(config.push){
		
		publicKey = config.push.public;
		privateKey = config.push.private;
	
	}else{
	
		const vapidKeys = webpush.generateVAPIDKeys();
		publicKey = vapidKeys.publicKey;
		privateKey = vapidKeys.privateKey;
		
		const c = JSON.parse(fs.readFileSync('./app/backend/config/app.json','utf8'));
		
		c.push = {public: publicKey, private: privateKey};
		
		fs.writeFileSync(a.dir + "/app/backend/config/app.json",JSON.stringify(c,undefined,"\t"));
	
	}
	
	webpush.setVapidDetails('mailto:' + config.properties.admin, publicKey, privateKey);
	
	this.publicKey = publicKey;
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