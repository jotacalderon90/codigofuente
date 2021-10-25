"use strict";

const fs = require('fs');
const helper = require('./lib/helper');

const filepath = '/frontend/assets/media/img/background/main.jpg';

const self = function(){
	
}

/*service upload background image
//@route('/api/background/image')
//@method(['post'])
*/
self.prototype.upload = async function(req,res){
	try{
		req.user = await helper.getUser(req);
		if(req.user==null || !helper.hasRole(req,['root','admin'])){throw(401);}
		
		if(req.body.url!==filepath){
			await fs.writeFileSync(config.dir + filepath, req.body.url.split(';base64,').pop(), {encoding: 'base64'});
		}
		
		res.json({data: true});
	}catch(e){
		helper.onError(req,res,e);
	}
}

module.exports = new self();