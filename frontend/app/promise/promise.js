app.modules.promise = new trascender({
	properties: {
		name: "promise", 
		label: "Promesas", 
		icon: "fa-file-text"
	},
	showApp: function(){
		return false;
	},
	messageFromServer: function(data){
		this.message(data.title, data.msg, data.class);
		this.FS = true;
	},
	message: function(title,message){
		return new Promise((resolve,reject)=>{
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.innerHTML = 'Aceptar';
			btn.setAttribute('class','btn btn-primary');
			btn.addEventListener( 'click' , (event)=>{
				$('#promise_modal_message').modal('hide');
				resolve(this.value);
				if(this.FS){
					this.FS = false;
					this.parent.menu.fadeIn();
					this.parent.refreshView();
				}
			});
			$('#promise_modal_message .modal-footer').html(btn);
			$('#promise_modal_message .modal-title').html(title);
			$('#promise_modal_message p').html(message);
			$('#promise_modal_message').modal('show');
		});
	},
	prompt: function(title,type,placeholder,value){
		return new Promise((resolve,reject)=>{
			const input = document.createElement('input');
			input.type = type;
			input.value = value || '';
			input.placeholder = placeholder;
			input.setAttribute('class','form-control');
			input.addEventListener( 'keypress' , function(event){
				if(event.which === 13){
					$('#promise_modal_prompt').modal('hide');
					resolve(this.value);
				}
			});
			$('#promise_modal_prompt .modal-title').html(title);
			$('#promise_modal_prompt .modal-body').html(input);
			$('#promise_modal_prompt').modal('show');
			
			$('#promise_modal_prompt .btn-head').unbind('click');
			$('#promise_modal_prompt .btn-head').click(()=>{
				$('#promise_modal_prompt').modal('hide');
				resolve('')
			});
		});
	},
	selector: function(title,options,onclose){
		return new Promise((resolve,reject)=>{
			$('#promise_modal_selector .btn-group-vertical').html("");
			for(let i = 0;i < options.length; i++){
				const btn = document.createElement('button');
				btn.setAttribute('type','button');
				btn.setAttribute('class','btn btn-default');
				if(typeof options[i]==='string'){				
					btn.setAttribute('value',options[i]);
					btn.innerHTML = options[i];	
				}else{					
					btn.setAttribute('value',options[i].value);
					btn.innerHTML = options[i].label;
				}
				btn.addEventListener( 'click' , function(event){
					$('#promise_modal_selector').modal('hide');
					resolve(this.value);
				});
				$('#promise_modal_selector .btn-group-vertical').append(btn);
			}
			$('#promise_modal_selector .modal-title').html(title);
			$('#promise_modal_selector').modal('show');
		});
	},
	confirm: function(title,message){
		return new Promise((resolve,reject)=>{
			const btnConfirm = document.createElement('button');
			btnConfirm.type = 'button';
			btnConfirm.innerHTML = '<i class="fa fa-check"></i>';
			btnConfirm.setAttribute('class','btn btn-success');
			btnConfirm.addEventListener( 'click' , (event)=>{
				$('#promise_modal_confirm').modal('hide');
				resolve(true);
			});
			const btnReject = document.createElement('button');
			btnReject.type = 'button';
			btnReject.innerHTML = '<i class="fa fa-close"></i>';
			btnReject.setAttribute('class','btn btn-warning');
			btnReject.addEventListener( 'click' , (event)=>{
				$('#promise_modal_confirm').modal('hide');
				resolve(false);
			});
			$('#promise_modal_confirm .modal-footer').html('');
			$('#promise_modal_confirm .modal-footer').append(btnConfirm);
			$('#promise_modal_confirm .modal-footer').append(btnReject);
			$('#promise_modal_confirm h4').html(title);
			$('#promise_modal_confirm p').html(message);
			$('#promise_modal_confirm').modal('show');
		});
	},
	clave: function(){
		return new Promise((resolve,reject)=>{
			const input = document.createElement('input');
			input.type = 'password';
			input.placeholder = 'Ingrese contraseña...';
			input.setAttribute('class','form-control');
			//input.focus();
			input.addEventListener( 'keypress' , function(event){
				if(event.which === 13){
					$('#promise_modal_clave').modal('hide');
					if(this.value=='123456'){
						resolve();
					}else{
						return reject('password incorrecta');
					}
				}
			});
			$('#promise_modal_clave .modal-content').html(input);
			$('#promise_modal_clave').modal('show');
		});
	}
});