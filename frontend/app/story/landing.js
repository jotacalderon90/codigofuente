app.modules.blog = new trascender({
	baseurl: "api/story",
	rowsByPage: 3,
	start: function(){
		this.query.tag = ['Clases de Informática'];
		this.options.sort = {created: -1};
		this.options.projection = {uri: 1,thumb: 1,resume: 1,title: 1};
		this.getCollection();
	},
	afterGetCollection: function(){
		this.parent.refreshView();
	},
	canEdit: function(){
		return this.hasRole('root') || this.hasRole('admin') || (this.doc!=null && this.hasRole('story') && this.doc.author == user._id);
	}
});
