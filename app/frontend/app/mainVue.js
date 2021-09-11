
new Vue({
	el: '#vue',
	data: {
		ip: ip, 
		headers: headers, 
		user: user, 
		pushcode: pushcode,
		modules: []
	},
	mounted: async function(){
		console.log('mainVue');
		for(let i=0;i<this.modules.length;i++){
			console.log(this.modules[i]);
		}
		$(".loader").fadeOut();
		
		//const s = await this.promise.message.load('hola','message');
		//console.log(s);
		
		try{
			const a = await this.promise.prompt.load('Test','');
			alert(a);
		}catch(e){
			if(e===null){
				alert('cancelo');
				return;
			}
			alert(e);
		}
	},
	template: template
});