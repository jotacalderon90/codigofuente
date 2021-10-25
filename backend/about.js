"use strict";

const helper = require('./lib/helper');
const logger = require('./lib/log')('route.about');

const self = function(){
	
}

/*
//@route('/about')
//@method(['get'])
*/
self.prototype.renderIndex = function(req,res){
	helper.render(req,res,'about/page',{app: 'about', action: 'open'});
}

module.exports = new self();