"use strict";

const helper = require('./lib/helper');
const logger = require('./lib/log')('route.chat');

const self = function(){
	
}

/*chat
//@route('/chat')
//@method(['get'])
*/
self.prototype.index = async function(req,res){
	logger.request(helper.reqToLog(req));
	helper.render(req,res,'index',{app: 'chat', action: 'openFromServer'});
}

module.exports = new self();