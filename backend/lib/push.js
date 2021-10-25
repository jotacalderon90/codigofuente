"use strict";

const fs = require("fs");
const webpush = require('web-push');
const mongodb = require('./mongodb');
const logger = require('./log')('lib.push');

const self = function(){
	
	let publicKey,privateKey;
	
	if(config.push){
		
		publicKey = config.push.public;
		privateKey = config.push.private;
	
	}else{
		
		const vapidKeys = webpush.generateVAPIDKeys();
		publicKey = vapidKeys.publicKey;
		privateKey = vapidKeys.privateKey;
		
		const c = JSON.parse(fs.readFileSync(config.dir + '/backend/lib/config/development.json','utf8'));
		
		c.push = {public: publicKey, private: privateKey};
		
		fs.writeFileSync(config.dir + "/backend/lib/config/development.json",JSON.stringify(c,undefined,"\t"));
	
	}
	
	webpush.setVapidDetails('mailto:' + config.properties.admin, publicKey, privateKey);
	
	this.publicKey = publicKey;
}

self.prototype.send = async function(push,data){
	try{
		webpush.sendNotification(push, JSON.stringify(data));
	}catch(e){
		logger.info(e);
	}
}

self.prototype.notificateToAdmin = async function(title,body,uri){
	try{
		const rows = await mongodb.find("user",{roles: {$in: ["root","admin"]}, push: {$exists: true}});
		for(let i=0;i<rows.length;i++){
			for(let x=0;x<rows[i].push.length;x++){
				const push = await mongodb.findOne("push",rows[i].push[x]);
				if(push!=null){
					this.send(push,{title: title, body: body, uri: uri});
				}
			}
		}
	}catch(e){
		logger.info(e);
	}
}

module.exports = new self();