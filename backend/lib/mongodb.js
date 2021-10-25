"use strict";

const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const self = function(){
	
}

self.prototype.connect = function(){
	return new Promise((resolve,reject)=>{
		MongoClient.connect(config.database.url, {useUnifiedTopology: true}, (error, client)=>{
			if(error){
				return reject(error);
			}else{
				this.client = client;
				this.db = client.db(config.database.db);
				resolve();
			}
		});
	});
}

self.prototype.toId = function(id){
	return new mongodb.ObjectID(id);
}

self.prototype.count = function(collection,query,options){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).countDocuments(query, options, function(error, data){
				if(error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.find = function(collection,query,options){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).find(query, options).toArray(function(error, data){
				if(error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.insertOne = function(collection,document){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).insertOne(document, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.findOne = function(collection,id){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).findOne({_id: new mongodb.ObjectID(id)}, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.updateOne = function(collection,id,document){
	delete document._id;
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			try{
				this.db.collection(collection)['replaceOne']({_id: new mongodb.ObjectID(id)}, document, (error, data) => {
					if (error){
						return reject(error);
					}else{
						resolve(data);
					}
				});
			}catch(e){
				console.log("ACTUALIZAR SEGUNDO INTENTO");
				console.log("COLECCION: " + collection);
				console.log("DOCUMENTO: " + JSON.stringify(document));
				this.db.collection(collection)['updateOne']({_id: new mongodb.ObjectID(id)}, document, (error, data) => {
					if (error){
						return reject(error);
					}else{
						resolve(data);
					}
				});
			}
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.deleteOne = function(collection,id){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).deleteOne({_id: new mongodb.ObjectID(id)}, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.distinct = function(collection,field){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).distinct(field, function(error, data) {
				if (error){
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

self.prototype.updateMany = function(collection,query,options){
	return new Promise((resolve,reject)=>{
		if(this.client /*&& this.client.isConnected()*/){
			this.db.collection(collection).updateMany(query, options, function(error, data) {
				if (error){ 
					return reject(error);
				}else{
					resolve(data);
				}
			});
		}else{
			return reject("SE CERRO LA CONEXION A LA BD :o :o:");
		}
	});
}

module.exports = new self();