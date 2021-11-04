"use strict";

const logger = require('./lib/log')('route.chat');
const helper = require('./lib/helper');

module.exports = {
	renderChat: async function(req,res){
		logger.request(helper.reqToLog(req));
		helper.render(req,res,'index',{app: 'chat', action: 'openFromServer'});
	}
}