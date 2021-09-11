"use strict";

const self = function(a){
	this.mongodb = a.mongodb;
	//this.start();
}

self.prototype.start = async function(){
	try{
		let parche;
		return;
		
		parche = await this.mongodb.find("topojson",{name: 'regiones'});
		if(parche[0].data.objects['chile-regions']){			
			for(let i=0;i<parche[0].data.objects['chile-regions'].geometries.length;i++){
				parche[0].data.objects['chile-regions'].geometries[i].properties.value = parche[0].data.objects['chile-regions'].geometries[i].properties.id;
				parche[0].data.objects['chile-regions'].geometries[i].properties.label = parche[0].data.objects['chile-regions'].geometries[i].properties.Region
				parche[0].data.objects['chile-regions'].geometries[i].properties.desc = parche[0].data.objects['chile-regions'].geometries[i].properties.Details;
				delete parche[0].data.objects['chile-regions'].geometries[i].properties.id;
				delete parche[0].data.objects['chile-regions'].geometries[i].properties.Region;
				delete parche[0].data.objects['chile-regions'].geometries[i].properties.Details;
				console.log(parche[0].data.objects['chile-regions'].geometries[i].properties);
			}
			parche[0].data.objects['data'] = parche[0].data.objects['chile-regions'];
			delete parche[0].data.objects['chile-regions'];
			await this.mongodb.updateOne('topojson',parche[0]._id,parche[0]);
		}else{
			console.log('regiones ya actualizada');
			//console.log(parche[0].data.objects.data.geometries.map((r)=>{return r.properties}));
		}
		
		parche = await this.mongodb.find("topojson",{name: 'provincias'});
		if(parche[0].data.objects['provincias']){			
			for(let i=0;i<parche[0].data.objects['provincias'].geometries.length;i++){
				parche[0].data.objects['provincias'].geometries[i].properties.value = parche[0].data.objects['provincias'].geometries[i].properties.COD_PROV;
				parche[0].data.objects['provincias'].geometries[i].properties.label = parche[0].data.objects['provincias'].geometries[i].properties.NOM_PROV;
				parche[0].data.objects['provincias'].geometries[i].properties.parent = parche[0].data.objects['provincias'].geometries[i].properties.COD_REGI;
				delete parche[0].data.objects['provincias'].geometries[i].properties.COD_PROV;
				delete parche[0].data.objects['provincias'].geometries[i].properties.NOM_PROV;
				delete parche[0].data.objects['provincias'].geometries[i].properties.COD_REGI;
				delete parche[0].data.objects['provincias'].geometries[i].properties.REGION;
				console.log(parche[0].data.objects['provincias'].geometries[i].properties);
			}
			parche[0].data.objects['data'] = parche[0].data.objects['provincias'];
			delete parche[0].data.objects['provincias'];
			await this.mongodb.updateOne('topojson',parche[0]._id,parche[0]);
		}else{
			console.log('provincias ya actualizada');
			//console.log(parche[0].data.objects.data.geometries.map((r)=>{return r.properties}));
		}
		
		parche = await this.mongodb.find("topojson",{name: 'comunas'});
		if(parche[0].data.objects['comunas']){			
			for(let i=0;i<parche[0].data.objects['comunas'].geometries.length;i++){
				parche[0].data.objects['comunas'].geometries[i].properties.value = parche[0].data.objects['comunas'].geometries[i].properties.CODIGO;
				parche[0].data.objects['comunas'].geometries[i].properties.label = parche[0].data.objects['comunas'].geometries[i].properties.NOM_COM;
				parche[0].data.objects['comunas'].geometries[i].properties.parent = parche[0].data.objects['comunas'].geometries[i].properties.PROV;
				delete parche[0].data.objects['comunas'].geometries[i].properties.CODIGO;
				delete parche[0].data.objects['comunas'].geometries[i].properties.NOM_COM;
				delete parche[0].data.objects['comunas'].geometries[i].properties.PROV;
				delete parche[0].data.objects['comunas'].geometries[i].properties.REGION;
				console.log(parche[0].data.objects['comunas'].geometries[i].properties);
			}
			parche[0].data.objects['data'] = parche[0].data.objects['comunas'];
			delete parche[0].data.objects['comunas'];
			await this.mongodb.updateOne('topojson',parche[0]._id,parche[0]);
		}else{
			console.log('comunas ya actualizada');
			//console.log(parche[0].data.objects.data.geometries.map((r)=>{return r.properties}));
		}
		
		
	}catch(e){
		console.log('ERROR:BLOG:START');
		console.log(e);
	}
}

/*get total of collection
//@route('/api/topojson/total')
//@method(['get'])
*/
self.prototype.total = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count('topojson',query);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*get documents of collection
//@route('/api/topojson/collection')
//@method(['get'])
*/
self.prototype.collection = async function(req,res){
	try{
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find('topojson',query,options);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

/*read object by id and collection
//@route('/api/topojson/:id')
//@method(['get'])
*/
self.prototype.read = async function(req,res){
	try{
		let row = await this.mongodb.findOne('topojson',req.params.id);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;