"use strict";

const self = function(a){
	this.helper = a.helper;
}

/*
//@route('/donaciones-con-exito')
//@method(['get'])
*/
self.prototype.conexito = function(req,res,next){
	this.helper.renderMessage(req,res,'Donación exitosa','Wuau, muchisimas gracias por su colaboración');
}

/*
//@route('/donaciones-sin-exito')
//@method(['get'])
*/
self.prototype.sinexito = function(req,res,next){
	this.helper.renderMessage(req,res,'Puta la wea :(','No se pudo realizar la operación, ¿que habrá pasado :O?','danger');
}

module.exports = self;