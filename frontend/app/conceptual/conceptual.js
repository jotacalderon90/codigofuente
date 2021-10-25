app.modules.conceptual = new trascender({
	properties: {
		name: "conceptual", 
		label: "Conceptual", 
		icon: "fa-sitemap"
	},
	showApp: function(){
		return true;//false;
	},
	onload: function(){
		this.convertService = this.serviceCreate("POST","/api/conceptual/convert");
		this.codeService = this.serviceCreate("GET","/api/conceptual/code");
		this.textarea = "";
		$('#conceptual_modal_form').delegate('textarea', 'keydown', function(e) {
			const keyCode = e.keyCode || e.which;
			if (keyCode == 9) {
				e.preventDefault();
				const start = this.selectionStart;
				const end = this.selectionEnd;
				$(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));
				this.selectionStart =
				this.selectionEnd = start + 1;
			}
		});
		this.started = false;
	},
	start: function(){
		
	},
	open: async function(){
		if(!this.started){
			this.started = true;
			$(".loader").fadeIn();
			if(this.canShowCode()){
				this.textarea = await this.codeService();
				this.convert();
				return;
			}
			$(".loader").fadeOut();
		}
		$("#conceptual_modal_form").modal("show");
	},
	firstOpen: async function(){
		await this.get_setting();
		this.set_setting();
		this.refreshAutocomplete();
		this.started = true;
		this.parent.refreshView();
	},
	
	convert: async function(caller){
		try{
			const data = await this.convertService({},this.formatBody({string: this.textarea}));
			await this.initGO(data,caller);
		}catch(e){
			alert(e);
		}
	},
	
	initGO: async function(data,caller) {
		this.caller = caller;
		try{
			var gomake = go.GraphObject.make; // for conciseness in defining templates
			this.myDiagram =
			gomake(go.Diagram, "conceptual_div_go", // must be the ID or reference to div
					{
						"toolManager.hoverDelay": 100, // 100 milliseconds instead of the default 850
						allowCopy: false,
						layout: // create a TreeLayout for the family tree
							gomake(go.TreeLayout, {
								angle: 90,
								nodeSpacing: 10,
								layerSpacing: 40,
								layerStyle: go.TreeLayout.LayerUniform
							})
					});
		}catch(e){
			if(e.toString().indexOf('div already has a Diagram associated with it')==-1){
				console.log('init',e);
			}
		}
		// replace the default Node template in the nodeTemplateMap
		this.myDiagram.nodeTemplate =
			gomake(go.Node, "Auto", {
					deletable: false,
					doubleClick: (e,node) => this.doubleClick(e,node)
				},
				new go.Binding("text", "name"),
				gomake(go.Shape, "Rectangle", {
						fill: "lightgray",
						stroke: null,
						strokeWidth: 0,
						stretch: go.GraphObject.Fill,
						alignment: go.Spot.Center
					},
					new go.Binding("fill", "gender", '#90CAF9')),
				gomake(go.TextBlock, {
						font: "700 12px Droid Serif, sans-serif",
						textAlign: "center",
						margin: 10,
						maxSize: new go.Size(80, NaN)
					},
					new go.Binding("text", "name"))
			);
		// define the Link template
		this.myDiagram.linkTemplate =
			gomake(go.Link, // the whole link panel
				{
					routing: go.Link.Orthogonal,
					corner: 5,
					selectable: false
				},
				gomake(go.Shape, {
					strokeWidth: 3,
					stroke: '#d3d3d3'
				})); // the gray link shape
		// create the model for the family tree
		this.myDiagram.model = new go.TreeModel(data);
		//await this.wait(1000);
		//this.myDiagram.commandHandler.zoomToFit();
		$("#conceptual_modal_document").modal("show");
	},
	doubleClick: async function(e, node){
		//console.log(e);
		//console.log(node);
		//console.log(node.data);
		$("#conceptual_modal_document").modal("hide");
		let c = node.data.name;
		if(c.indexOf('\n')>-1){
			c = await this.parent.promise.selector('Seleccione un concepto',c.split('\n'));
		}
		this.parent.pushStory('#conceptual_modal_document');
		this.parent[this.caller].onConceptualSelect(c);
	},
	canShowCode: function(){
		return this.hasRole('root') || this.hasRole('admin');
	}
	
});
