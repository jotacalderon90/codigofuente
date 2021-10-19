"use strict";

const self = function(a){
	this.helper = a.helper;
}

/*about
//@route('/about')
//@method(['get'])
*/
self.prototype.index = async function(req,res,next){
	res.render("about/page",{...this.helper.toRender(req), btnCloseToIndex: true, onOpen: {app: 'about', action: 'open'}});
}

module.exports = self;