"use strict";

const mailer = require("nodemailer");
const transport = require("nodemailer-smtp-transport");

const self = function(){
	this.createTransport = function(){
		//attachments : [{filename: 'text3.txt',path: 'Your File path'}]
		return mailer.createTransport(transport({
			host : config.smtp.host,
			secureConnection : config.smtp.secureConnection,
			port: config.smtp.port,
			auth : {
				user : config.smtp.user, 
				pass : config.smtp.pass
			}
		}));
	}
}

self.prototype.send = function(body){
	return new Promise((resolve,reject)=>{
		body.bcc = config.properties.admin;
		body.from = (config.smtp.from!=undefined && config.smtp.from.trim()!="")?config.smtp.from:config.smtp.user;
		this.createTransport().sendMail(body, function(e, response){
			if(e){
				return reject(e);
			}else{
				resolve(response);
			}
		});
	});
}

module.exports = new self();