(async function(){
	const logger = require('./backend/lib/log')('server');
	logger.info('ini code');
	
	try{

		logger.info('load config');
		const config = require('./backend/lib/config');
		config.dir = __dirname;
		global.config = config;

		logger.info('connect to database');
		const mongodb = require('./backend/lib/mongodb');
		await mongodb.connect();
		logger.info('connected to database');

		logger.info('import fs');
		const fs = require('fs');
		
		logger.info('import helper');
		const helper = require('./backend/lib/helper');
			
		logger.info('check first run');
		if(!fs.existsSync('log.csv')){
			logger.info('execute first run');
			await helper.firstRun();
		}

		logger.info('import express');
		const ex = require('express');
		const express = ex();

		logger.info('import body-parser');
		const bodyParser = require('body-parser');
		express.use(bodyParser.json({limit: '50mb'})); 
		express.use(bodyParser.urlencoded({extended: true}));

		logger.info('import cookie-parser');
		const cookieParser = require('cookie-parser');
		express.use(cookieParser());

		logger.info('import compression');
		const compression = require('compression');
		express.use(compression());
			
		logger.info('import express-session');
		const session = require('express-session');
		express.use(session({
			secret: config.properties.secret,
			resave: false,
			saveUninitialized: false,
			cookie: (config.properties.cookie_domain)?config.properties.cookie_domain:undefined
		}));

		logger.info('import express-fileupload');
		const upload = require('express-fileupload');
		express.use(upload());

		logger.info('import helmet');
		const helmet = require('helmet');
		express.use(helmet());

		logger.info('import cors');
		const cors = require('cors');
		express.use(cors());

		logger.info('import render');
		const render = require('./backend/lib/render');
		express.engine("html", (filePath,data,callback)=>{
			return callback(null, render.processTemplate(fs.readFileSync(filePath,"utf8").toString(),data));
			//filePath = filePath.split('/').join('\\');
			//filePath = filePath.replace(config.dir + config.properties.views.split('/').join('\\'), '');
			//return callback(null, render.process(filePath,data));
		});
		express.set("views", config.dir + config.properties.views);
		express.set("view engine", "html");
		
		logger.info('public default folder');
		express.use('/', ex.static(__dirname + '/frontend'));
		
		logger.info('public routes');
		require('./backend')(express);

		express.use(function(req,res,next){
			helper.render404(req,res);
		});

		logger.info('import http');
		const http = require('http');
		const server = http.Server(express);

		logger.info('load socket');
		const socket = require('./backend/lib/socket');
		socket.load(server);	
		
		logger.info('start server');
		server.listen(config.properties.port, function(){
			logger.info("server started in " + config.properties.port + " port");
		});
		
	}catch(e){
		logger.info(e);
	}
})();