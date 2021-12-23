const fs = require('fs');

const config = JSON.parse(fs.readFileSync(process.cwd() + '/config.json','utf8'));

config.properties.views = '/frontend/app/';

module.exports = config;