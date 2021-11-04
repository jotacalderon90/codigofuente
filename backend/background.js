"use strict";

const logger = require('./lib/log')('route.background');
const helper = require('./lib/helper');
const fs = require('fs');

module.exports = {
	upload: async function(req,res){
		try{
			req.user = await helper.getUser(req);
			if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
			
			const filepath = '/frontend/assets/media/img/background/main.jpg';
			
			if(req.body.url!==filepath){
				await fs.writeFileSync(config.dir + filepath, req.body.url.split(';base64,').pop(), {encoding: 'base64'});
			}
			
			res.json({data: true});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
};