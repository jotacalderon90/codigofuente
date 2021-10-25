"use strict";

const jwt = require("jwt-simple");

const self = function(){

}

self.prototype.encode = function(user){
	const iat = new Date();
	const exp = new Date(iat.getFullYear(),iat.getMonth(),iat.getDate(),iat.getHours(), iat.getMinutes() + 60);
	return jwt.encode({
		sub: user._id,
		//roles: user.roles,
		iat: iat,
		exp: exp
	},config.properties.secret);
}

self.prototype.decode = function(token){
	try{
		const payload = jwt.decode(token,config.properties.secret);
		if(new Date(payload.exp) <= new Date()){
			throw("expired");
		}
		return payload;
	}catch(e){
		return {error: e.toString()};
	}
}

module.exports = new self();