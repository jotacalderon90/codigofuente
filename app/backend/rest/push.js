"use strict";

const self = function(a){
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.push = a.push;
}

/*subscribe
//@route('/api/push/subscribe')
//@method(['post'])
*/
self.prototype.subscribe = async function(req,res){
	try{
		req.body.created = new Date();
		const r = await this.mongodb.insertOne("push",req.body);
		let m = 'nuevo subscriptor ';
		if(req.user){
			await this.mongodb.updateOne("user",req.user._id,{$push:{push: r.insertedId}});
			m+= req.user.email;
		}
		
		this.push.notificateToAdmin(m,req.body.created);
		
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e});
	}
}

/*unsubscribe
//@route('/api/push/unsubscribe')
//@method(['post'])
*/
self.prototype.unsubscribe = async function(req,res){
	try{
		const row = await this.mongodb.find("push",{endpoint: req.body.endpoint});
		if(row.length==1){
			await this.mongodb.deleteOne("push",row[0]._id);
			row[0].razon = req.body.razon;
			await this.mongodb.insertOne("pushd",row[0]);			
				
			let m = 'un subscriptor menos ';
			if(req.user){
				await this.mongodb.updateOne("user",req.user._id,{$pull:{push: row[0]._id}});
				m+= req.user.email;	
			}
			
			this.push.notificateToAdmin(m,req.body.razon);
		}
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e});
	}
}

/*notificate
//@route('/api/push/notificate')
//@method(['post'])
//@roles(['root','admin','user'])
*/
self.prototype.notificate = async function(req,res){
	try{
		for(let i=0;i<req.body.receptor.length;i++){
			this.push.send(req.body.receptor[i].push, {title: "Notificación de " + req.user.nickname, body: req.body.body, uri: "/chat"});
		}
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e});
	}
}

module.exports = self;