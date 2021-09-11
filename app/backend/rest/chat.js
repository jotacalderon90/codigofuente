"use strict";

const self = function(a){
	this.helper = a.helper;
}

/*chat
//@route('/chat')
//@method(['get'])
*/
self.prototype.index = async function(req,res){
	res.render("index",{...this.helper.toRender(req), onOpen: {app: "chat", action: "openFromServer"}});
}

module.exports = self;