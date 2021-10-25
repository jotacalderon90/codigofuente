"use strict";

const readline = require('readline');

const self = function(){
	this.rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
}

self.prototype.ask = function(question){
	return new Promise((resolve,reject)=>{
		this.rl.question(question, (answer) => {
			if(answer.trim()!=""){
				resolve(answer);
			}else{
				return reject(answer);
			}
		});
	});
}

module.exports = new self();