"use strict";

const logger = require('./lib/log')('route.donation');
const helper = require('./lib/helper');

module.exports = {
	conexito: async function(req,res){
		helper.renderMessage(req,res,'Donación exitosa','Wuau, muchisimas gracias por su colaboración');
	},
	sinexito: async function(req,res){
		helper.renderMessage(req,res,'Puta la wea :(','No se pudo realizar la operación, ¿que habrá pasado :O?','danger');
	}
}