const editHTML = function(filepath,modal,parent){
	const f = btoa(filepath);
	this.modal = $('#' + modal);
	this.element = this.modal.find('[data-editable]')[0];	
	this.canEdit = (user && user.roles && (user.roles.indexOf('root')>-1 || user.roles.indexOf('admin')>-1))?true:false;
	this.service_read = this.serviceCreate('GET','/api/file/frontend/' + f);
	this.service_save = this.serviceCreate('PUT','/api/file/frontend/' + f);
	this.action = '';
	this.parent = parent;
}
editHTML.prototype.edit = function(){
	this.element.setAttribute('contenteditable', 'true'); 
	this.action = 'edit';
}
editHTML.prototype.save = async function(){
	this.modal.modal('hide');
	$('.loader').fadeIn();
	let m;
	try{
		
		const current = await this.service_read({});
		const divisor1 = '<!--editable-->';
		const divisor2 = '<!--/editable-->';
		
		const ini = current.indexOf(divisor1); 
		const fin = current.indexOf(divisor2); 
		
		const updated = current.substr(0,ini) + this.element.innerHTML.trim() + current.substr(fin + divisor2.length);
		
		await this.service_save({},{content: updated}); 
		
		m = 'Archivo modificado correctamente';
	}catch(e){
		m = e.error || e.toString();
	}
	$('.loader').fadeOut();
	await this.parent.promise.message('Aviso', m);
	this.element.removeAttribute('contenteditable'); 
	this.action = '';
	this.modal.modal('show');
	this.parent.refreshView();
}
editHTML.prototype.serviceCreate = function(METHOD,URL){
	if(METHOD == "GET" || METHOD == "DELETE"){
		return function(params){
			return this.execute(METHOD,this.URIBuild(URL,params),undefined,undefined);
		}
	}else if(METHOD == "POST" || METHOD == "PUT"){
		return function(params,body){
			return this.execute(METHOD,this.URIBuild(URL,params),body);
		}
	}
}	
editHTML.prototype.URIBuild = function(uri,params){
	for(var attr in params){
		uri = uri.replace(":"+attr,params[attr]);
	}
	return uri;
}
editHTML.prototype.execute = function(method,url,body){
	return new Promise(function(resolve, reject) {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4) {
				try{
					if(xhttp.status == 200){
						xhttp.json = JSON.parse(xhttp.responseText);
						if(xhttp.json.data!=null){
							resolve(xhttp.json.data);
						}else{
							throw(xhttp.json.error);
						}
					}else if(xhttp.status == 401){
						location.reload();
					}else{
						throw({status: xhttp.status});
					}
				}catch(e){
					reject({
						error: e,
						xhttp: xhttp
					});
				}
			}
		};
		xhttp.open(method,url);
		if(body!=undefined){
			xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			if(typeof body!="string"){
				body = JSON.stringify(body);
			}
			xhttp.send(body);
		}else{
			xhttp.send();
		}
	});
}