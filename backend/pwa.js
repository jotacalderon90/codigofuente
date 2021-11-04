"use strict";

const logger = require('./lib/log')('route.pwa');
const helper = require('./lib/helper');

module.exports = {
	manifest: async function(req,res,next){
		try{
			res.json(config.pwa.manifest);
		}catch(e){
			helper.onError(req,res,e);
		}
	},
	sw: async function(req,res){
		res.sendFile(config.dir + '/frontend/assets/pwa/sw.js');
	}
};