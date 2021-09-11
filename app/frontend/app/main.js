app.controller("ctrl", function($scope){
	this.start = async function(){
		this.modules = [];
		for(module in app.modules){
			this.modules.push(module);
			this[module] = app.modules[module];
			this[module].parent = this;
			if(this[module].start){
				await this[module].start();
			}
		}
		if(this.modules.length == 0){
			alert("No hay aplicaciones instaladas");
			return;
		}
		
		this.menu.fadeOut();
		this.pushStory(null);
		this.pushStory('#menu_modal_list');
		
		if(onOpen!==undefined){
			this[onOpen.app][onOpen.action](onOpen.data);
			$(".loader").fadeOut();
		}else{
			this.refreshView();
			this.landing.open();
			$(".loader").fadeOut();
		}
		
	}
	this.refreshView = function(){
		$scope.$digest(function(){});
	}
	this.start();
	this.history = [];
	this.open = function(app,story){
		this.pushStory(story);
		this.menu.refreshSelectApps(app.name);
		this[app.name].open();
	}
	this.pushStory = function(modal){
		this.history.push(modal);
	}
	this.close = function(volver){
		if(this.history.length > 1){
			$(this.history[this.history.length-1]).modal('show');
			this.history.pop();
		}else{
			this.history.pop();
			this.menu.fadeIn();
		}
	}
	this.closeAll = function(){
		this.history = [];
		this.menu.fadeIn();
	}
});
$(window).on("resize", function () {
	$('.autoheight').css('min-height', ($(window).height()));
}).resize();