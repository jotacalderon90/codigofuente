"use strict";

const fs = require("fs");
const path = require("path");
const logger = require('./lib/log')('backend');
const helper = require('./lib/helper');

module.exports = function(express){
	
	const folder = __dirname;
	
	const extract = function(content,from,to){
		var index1 = content.indexOf(from) + from.length;
		content = content.substring(index1);
		var index2 = content.indexOf(to);
		return content.substring(0,index2);
	}
	
	//funcion generica que exporta el metodo para api 
	const getAPI = function(api,method){
		return function(req,res,next){
			api[method](req,res,next);
		}
	}
			
	//obtener archivos modulares
	const api = fs.readdirSync(folder,"utf8").filter((row)=>{
		return row != 'index.js' && fs.statSync(path.join(folder,row)).isFile();
	});
	
	api.sort();
	for(let i=0;i<api.length;i++){
		const b = api[i];
		logger.info('publish api ' + b);
		const c = fs.readFileSync(folder + '/' + b,"utf-8");
		const a = require(folder + '/' + b);
		const r = c.split("//@route");
		for(let x=1;x<r.length;x++){
			const data = r[x];
			const uri = eval(extract(data,"(",")"));
			const method = eval(extract(data,"@method(",")"));
			const action = extract(data,"self.prototype.","=").trim();
			let roles = [];
			if(data.indexOf("@roles(")>-1){
				roles = eval(extract(data,"@roles(",")"));
			}
			for(let y=0;y<method.length;y++){
				if(roles.length > 0){
					
					//middleware of authorization
					express[method[y]](uri, async function(req,res,next){
						try{
							req.user = await helper.getUser(req);
							if(req.user==null){
								throw(401);
							}
							for(let i=0;i<roles.length;i++){
								if(req.user.roles.indexOf(roles[i])>-1){
									return next();
								}
							}
							throw(401);
						}catch(e){
							if(e==401){
								logger.info(helper.reqToLog(req));
								if(req.url.indexOf("/api/")>-1){
									res.sendStatus(401);
								}else{
									req.session.redirectTo = req.url;
									res.status(401).render("index", helper.toRenderError('401',e));
								}
							}else{
								logger.info(e);
								res.sendStatus(401);
							}
						}
					},getAPI(a,action));
					//express[method[y]](uri, getAPI(a,action));
				}else{

					express[method[y]](uri, getAPI(a,action));
				}
			}
		}
	}
}