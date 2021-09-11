"use strict";

const fs = require('fs');

const self = function(a){
	this.dir = a.dir;
	this.helper = a.helper;
	this.path = '/assets/media/img/background/main.jpg';
}

/*service upload background image
//@route('/api/background/image')
//@method(['post'])
//@roles(['root','admin'])
*/
self.prototype.upload = async function(req,res){
	try{
		if(req.body.url!==this.path){
			const base64Image = req.body.url.split(';base64,').pop();
			await fs.writeFileSync(this.dir + '/app/frontend' + this.path, base64Image, {encoding: 'base64'});
		}
		res.json({data: true});
	}catch(e){
		res.json({data: null,error: e});
	}
}

module.exports = self;