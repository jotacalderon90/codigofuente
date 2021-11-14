"use strict";

const fs = require("fs");
const path = require("path");

const logger = require('./lib/log')('backend');
const helper = require('./lib/helper');

const ctrlFiles = fs.readdirSync(__dirname,"utf8").filter((row)=>{
	return row != 'index.js' && fs.statSync(path.join(__dirname,row)).isFile();
});

const api = {};
for(let i=0;i<ctrlFiles.length;i++){
	const name = ctrlFiles[i].replace('.js','');
	logger.info('loading api ' + name);
	api[name] = require(__dirname + '/'+ name);
}
	
module.exports = function(express){
	
	/*********/
	/*DEFAULT*/
	/*********/
	express.get('/', api.default.renderHome);
	express.get('/about', api.default.renderAbout);
	express.get('/vue', api.default.renderVue);
	express.get('/favicon.ico', api.default.favicon);
	express.get('/robots.txt', api.default.robots);
	express.post('/api/message', api.default.message);
	
	/*PWA*/
	express.get('/manifest.json', api.pwa.manifest);
	express.get('/sw.js', api.pwa.sw);
	
	/******/
	/*PUSH*/
	/******/
	express.post('/api/push/subscribe', api.push.subscribe);
	express.post('/api/push/unsubscribe', api.push.unsubscribe);
	express.post('/api/push/notificate', api.push.notificate);
	
	/******/
	/*BLOG*/
	/******/
	express.get('/blog', api.blog.renderCollection);
	express.get('/blog/categoria/:id', api.blog.renderCollectionTag);
	express.get('/blog/new', api.blog.new);
	express.get('/blog/:id.html', api.blog.renderHtml);
	express.get('/blog/:id', api.blog.renderDocument);
	express.get('/blog/edit/:id', api.blog.edit);
	
	express.get('/api/blog/total', api.blog.total);
	express.get('/api/blog/collection', api.blog.collection);
	express.get('/api/blog/tag/collection', api.blog.tag);
	express.post('/api/blog', api.blog.create);
	express.get('/api/blog/:id', api.blog.read);
	express.put('/api/blog/:id', api.blog.update);
	express.delete('/api/blog/:id', api.blog.delete);
	express.post('/api/blog/:id/image', api.blog.upload);
	express.get('/api/blog/admin/setting', api.blog.get_setting);
	express.put('/api/blog/admin/setting', api.blog.put_setting);
	
	/*********/
	/*PRODUCT*/
	/*********/
	express.get('/product', api.product.renderCollection);
	express.get('/product/categoria/:id', api.product.renderCollectionTag);
	express.get('/product/new', api.product.new);
	express.get('/product/:id', api.product.renderDocument);
	express.get('/product/edit/:id', api.product.edit);
	express.get('/api/product/total', api.product.total);
	express.get('/api/product/collection', api.product.collection);
	express.get('/api/product/tag/collection', api.product.tag);
	express.post('/api/product', api.product.create);
	express.get('/api/product/:id', api.product.read);
	express.put('/api/product/:id', api.product.update);
	express.delete('/api/product/:id', api.product.delete);
	express.post('/api/product/:id/image', api.product.upload);
	express.get('/api/product/admin/setting', api.product.get_setting);
	express.put('/api/product/admin/setting', api.product.put_setting);
	
	/***********/
	/*ECOMMERCE*/
	/***********/
	express.post('/ecommerce/transaction', api.ecommerce.ecommerce_create);
	express.get('/ecommerce/transaction/:id', api.ecommerce.ecommerce_read);
	express.post('/ecommerce/transaction/:id', api.ecommerce.ecommerce_update);
	express.get('/api/ecommerce/:id', api.ecommerce.read);
	
	/*******/
	/*STORY*/
	/*******/
	express.get('/story/un-dia-como-hoy', api.story.undiacomohoy);
	express.get('/story', api.story.renderCollection);
	express.get('/story', api.story.renderCollection);
	express.get('/story/categoria/:id', api.story.renderCollectionTag);
	express.get('/story/new', api.story.new);
	express.get('/story/:id', api.story.renderDocument);
	express.get('/story/edit/:id', api.story.edit);
	express.get('/api/story/total', api.story.total);
	express.get('/api/story/collection', api.story.collection);
	express.get('/api/story/tag/collection', api.story.tag);
	express.post('/api/story', api.story.create);
	express.get('/api/story/:id', api.story.read);
	express.put('/api/story/:id', api.story.update);
	express.delete('/api/story/:id', api.story.delete);
	express.post('/api/story/:id/image', api.story.upload);
	express.get('/api/story/admin/setting', api.story.get_setting);
	express.put('/api/story/admin/setting', api.story.put_setting);
	
	/*********/
	/*TWITTER*/
	/*********/
	express.get('/twitter', api.twitter.renderCollection);
	express.get('/twitter', api.twitter.renderCollection);
	express.get('/twitter/categoria/:id', api.twitter.renderCollectionTag);
	express.get('/twitter/new', api.twitter.new);
	express.get('/twitter/:id', api.twitter.renderDocument);
	express.get('/twitter/edit/:id', api.twitter.edit);
	express.get('/api/twitter/total', api.twitter.total);
	express.get('/api/twitter/collection', api.twitter.collection);
	express.get('/api/twitter/tag/collection', api.twitter.tag);
	express.post('/api/twitter', api.twitter.create);
	express.get('/api/twitter/:id', api.twitter.read);
	express.put('/api/twitter/:id', api.twitter.update);
	express.delete('/api/twitter/:id', api.twitter.delete);
	express.post('/api/twitter/:id/image', api.twitter.upload);
	express.get('/api/twitter/admin/setting', api.twitter.get_setting);
	express.put('/api/twitter/admin/setting', api.twitter.put_setting);
	
	/*********/
	/*GALLERY*/
	/*********/
	express.get('/api/gallery/collection', api.gallery.collection);
	express.post('/api/gallery', api.gallery.update);
	express.delete('/api/gallery/:id', api.gallery.delete);
	express.get('/api/gallery/:id/collection', api.gallery.collection_file);
	express.post('/api/gallery/:id/uploader', api.gallery.upload_file);
	express.delete('/api/gallery/:id/:file', api.gallery.delete_file);
	
	/********/
	/*CLIENT*/
	/********/
	express.get('/api/client/ip', api.client.ip);
	express.get('/api/client/geoip', api.client.geoip);
	express.get('/api/client/geoip/:ip', api.client.geoipFromIP);
	
	/*********/
	/*COMMENT*/
	/*********/
	express.get('/api/comment/total', api.comment.total);
	express.get('/api/comment/collection', api.comment.collection);
	express.post('/api/comment', api.comment.create);
	
	/************/
	/*CONCEPTUAL*/
	/************/
	express.post('/api/conceptual/convert', api.conceptual.convert);
	express.get('/api/conceptual/code', api.conceptual.code);
	
	/******/
	/*CHAT*/
	/******/
	express.get('/chat', api.chat.renderChat);
	
	/**********/
	/*DONATION*/
	/**********/
	express.get('/donaciones-con-exito', api.donation.conexito);
	express.get('/donaciones-sin-exito', api.donation.sinexito);
	
	/******/
	/*WALL*/
	/******/
	express.get('/wall', api.wall.renderCollection);
	express.get('/wall/categoria/:id', api.wall.renderCollectionTag);
	express.get('/api/wall/total', api.wall.total);
	express.get('/api/wall/collection', api.wall.collection);
	express.get('/api/wall/tag/collection', api.wall.tags);
	express.post('/api/wall', api.wall.create);
	express.delete('/api/wall/:id', api.wall.delete);
	
	/*********/
	/*ACCOUNT*/
	/*********/
	express.post('/account', api.account.create);
	express.post('/account/login', api.account.login);
	express.get('/account/info', api.account.info);
	express.post('/account/update', api.account.update);
	express.get('/account/logout', api.account.logout);
	express.get('/account/activate/:hash', api.account.activate);
	express.get('/account/desactivate/:hash', api.account.desactivate);
	express.post('/account/forget', api.account.forget);
	express.get('/account/recovery', api.account.recovery);
	express.post('/account/recovery', api.account.recovery);
	express.get('/user/auth/google/callback', api.account.google_login);
	express.post('/api/user', api.account.createByAdmin);
	express.get('/api/account/google_auth', api.account.getURL);
	express.get('/api/account/:id', api.account.getPublicInfo);
	
	/***********/
	/*DIRECTORY*/
	/***********/
	express.get('/api/folder/full', api.directory.fullDirectory);
	express.get('/api/folder/:id/total', api.directory.total);
	express.get('/api/folder/:id/collection', api.directory.collection);
	express.post('/api/folder/:id', api.directory.create);
	express.put('/api/folder/:id', api.directory.update);
	express.delete('/api/folder/:id', api.directory.delete);
	express.get('/api/file/:id/total', api.directory.file_total);
	express.get('/api/file/:id/collection', api.directory.file_collection);
	express.post('/api/file/:id', api.directory.file_create);
	express.get('/api/file/:id', api.directory.file_read);
	express.put('/api/file/:id', api.directory.file_update);
	express.delete('/api/file/:id', api.directory.file_delete);
	express.put('/api/file/:id/rename', api.directory.file_rename);
	express.get('/api/file/:id/download', api.directory.file_download);
	express.get('/api/file/:id/getfile', api.directory.file_get);
	express.post('/api/file/:id/uploader', api.directory.file_upload);
	
	/***********/
	/*DIRECTORY_PUBLIC*/
	express.get('/api/file/frontend/:id', api.directory_public.read);
	express.put('/api/file/frontend/:id', api.directory_public.update);
	/***********/
	
	/**********/
	/*DATABASE*/
	/**********/
	express.get('/api/document/:name/export', api.database.export);
	express.post('/api/document/:name/import', api.database.import);
	express.get('/api/document/:name/total', api.database.total);
	express.get('/api/document/:name/collection', api.database.collection);
	express.get('/api/document/:name/tags', api.database.tags);
	express.post('/api/document/:name', api.database.create);
	express.get('/api/document/:name/:id', api.database.read);
	express.put('/api/document/:name/:id', api.database.update);
	express.delete('/api/document/:name/:id', api.database.delete);
	
	/************/
	/*BACKGROUND*/
	/************/
	express.post('/api/background/image', api.background.upload);
	express.get('/api/background/collection', api.background2.collection);
	
	/*********/
	/*MAILING*/
	/*********/
	express.get('/api/mailing/templates', api.mailing.templates);
	express.get('/api/mailing/templates/:id', api.mailing.template_metadata);
	express.get('/mailing/templates/:id', api.mailing.render_template);
	express.get('/api/mailing/users/tag', api.mailing.users_tag);
	express.get('/api/mailing/users/:id', api.mailing.users_by_tag);
	express.post('/api/mailing/message', api.mailing.message);
	express.get('/assets/media/img/pxmagico.png', api.mailing.pxmagico);
	
	/******/
	/*POLL*/
	/******/
	express.get('/api/poll/total', api.poll.total);
	express.get('/api/poll/collection', api.poll.collection);
	express.get('/api/poll/users/tag', api.poll.users_tag);
	express.get('/api/poll/users/:id', api.poll.users_by_tag);
	express.post('/api/poll', api.poll.create);
	express.get('/api/poll/:id', api.poll.read);
	express.put('/api/poll/:id', api.poll.update);
	express.delete('/api/poll/:id', api.poll.delete);
	express.put('/api/poll/start/:id', api.poll.start);
	express.put('/api/poll/notify/:id/:to', api.poll.notify);
	express.get('/api/poll/:id/answer/:encode', api.poll.answer);
	express.post('/api/poll/:id/answer/:encode', api.poll.answer);
	express.get('/api/poll/:id/answer', api.poll.answer_anon);
	express.post('/api/poll/:id/answer', api.poll.answer_anon);
	express.get('/api/poll/:id/result', api.poll.result);
	
	/*****/
	/*LOG*/
	/*****/
	express.get('/api/log/total', api.log.total);
	express.get('/api/log/collection', api.log.collection);
	express.get('/api/log/:id', api.log.read);
	
	/**********/
	/*TOPOJSON*/
	/**********/
	express.get('/api/topojson/total', api.topojson.total);
	express.get('/api/topojson/collection', api.topojson.collection);
	express.get('/api/topojson/:id', api.topojson.read);
	
	/*******/
	/*USERS*/
	/*******/
	express.get('/api/users/total', api.users.total);
	express.get('/api/users/collection', api.users.collection);
	express.get('/api/users/tags', api.users.tags);
	express.post('/api/users', api.users.create);
	express.put('/api/users/:id', api.users.update);
	express.delete('/api/users/:id', api.users.delete);
	
}