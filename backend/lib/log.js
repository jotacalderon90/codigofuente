
const fs = require('fs');
let stream = null;

writeLog = async function(data){
	try{			
		if(stream==null){
			stream = fs.createWriteStream(config.dir + '/log.csv', {flags: 'a'});
		}
		if(stream!=null){
			stream.write(data + '\n');
		}
	}catch(e){
		
	}
}

const self = function(parent){
	this.parent = parent;
}

self.prototype.info = function(data){
	console.log(this.parent, new Date().toLocaleString(), data);
}

self.prototype.request = function(data){
	this.info(data);
	writeLog(data);	
}

module.exports = function(parent){
	return new self(parent);
};