const fs = require('fs');

const config = JSON.parse(fs.readFileSync(__dirname + '/development.json','utf8'));

config.properties.views = '/frontend/app/';

module.exports = config;