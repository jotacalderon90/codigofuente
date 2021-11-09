"use strict";

const logger = require('./lib/log')('route.background2');
const helper = require('./lib/helper');
const fs = require('fs');
const path = require('path');

module.exports = {
	collection: async function(req,res){
		try{
			const directory = 'assets/media/img/gallery/background2';
			res.json({data: fs.readdirSync(config.dir + '/frontend/' + directory,"utf8").filter((row)=>{
				return fs.statSync(path.join(config.dir + '/frontend/' + directory,row)).isFile();
			}).map((r)=>{return directory + '/' + r})});
		}catch(e){
			helper.onError(req,res,e);
		}
	}
};