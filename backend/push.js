"use strict";

const logger = require('./lib/log')('route.push');
const helper = require('./lib/helper');
const mongodb = require('./lib/mongodb');
const push = require('./lib/push');

module.exports = {
	subscribe: async function(req,res){
		try{
			req.body.created = new Date();
			const r = await mongodb.insertOne("push",req.body);
			let m = 'nuevo subscriptor ';
			if(req.user){
				await mongodb.updateOne("user",req.user._id,{$push:{push: r.insertedId}});
				m+= req.user.email;
			}
			
			push.notificateToAdmin(m,req.body.created);
			
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	unsubscribe: async function(req,res){
		try{
			const row = await mongodb.find("push",{endpoint: req.body.endpoint});
			if(row.length==1){
				await mongodb.deleteOne("push",row[0]._id);
				row[0].razon = req.body.razon;
				await mongodb.insertOne("pushd",row[0]);			
					
				let m = 'un subscriptor menos ';
				if(req.user){
					await mongodb.updateOne("user",req.user._id,{$pull:{push: row[0]._id}});
					m+= req.user.email;	
				}
				
				push.notificateToAdmin(m,req.body.razon);
			}
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	notificate: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			logger.request(helper.reqToLog(req));
			if(req.user==null || !helper.hasRole(req,['root','admin','user'])){throw(401);}
			
			for(let i=0;i<req.body.receptor.length;i++){
				push.send(req.body.receptor[i].push, {title: "Notificación de " + req.user.nickname, body: req.body.body, uri: "/chat"});
			}
			res.send({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
}