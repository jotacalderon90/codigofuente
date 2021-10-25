app.modules.log = new trascender({
	properties: {
		name: "log", 
		label: "Log", 
		icon: "fa-bar-chart"	
	},
	showApp: function(){
		return true;
	},
	rowsByPage: 100,
	increase: true,
	service: {
		total: ['GET','api/log/total?date=:date'],
		collection: ['GET','api/log/collection?date=:date&options=:options'],
		geoip: ['GET','/api/client/geoip/:ip']
	},
	onload: function(){
		this.bots = [];
	},
	open: function(){
		$('#log_modal_form').modal('show');
	},
	start: function(){
		this.query = {date: new Date()};
	},
	paramsToGetTotal: function(){
		$(".loader").fadeIn();
		this.coll = [];
		this.obtained = 0;
		this.options.skip = 0;
		return {date:  moment(this.query.date).format("YYYY-MM-DD")};
	},
	afterGetTotal: async function(){
		await this.getAll();
		
		//parche por problemas de conf host
		this.coll = this.coll.filter((r)=>{return host.indexOf(r.headers.host)>-1});
		console.log(this.coll);
		
		const doc = {
			length: {
				rows: this.coll.length,
				ips: 0,
				agent: 0,
				bots: 0
			},
			ips: [],
			agent: [],
			bots:[]
		};
		
		for(let i=0;i<this.coll.length;i++){
			try{			
				if(doc.ips.indexOf(this.coll[i].ip)==-1){
					
					if(this.coll[i].ip!=null){
						doc.length.ips++;
						doc.ips.push(this.coll[i].ip);
					}
					
					if(doc.agent.indexOf(this.coll[i].headers['user-agent'])==-1){
						if(this.coll[i].headers['user-agent'].toLowerCase().indexOf('bot')>-1){
							if(doc.bots.indexOf(this.coll[i].headers['user-agent'])==-1){
								doc.length.bots++;
								doc.bots.push(this.coll[i].headers['user-agent']);
							}
						}else{						
							doc.length.agent++;
							doc.agent.push(this.coll[i].headers['user-agent']);		
						}
					}
				}
			}catch(e){
				console.log(e);
			}
		}
		this.select({_content:  JSON.stringify(doc, undefined, "\t")});
		this.parent.refreshView();
		$(".loader").fadeOut();
	},
	paramsToGetCollection: function(){
		return {date:  moment(this.query.date).format("YYYY-MM-DD"), options: JSON.stringify(this.options)};
	},
	getMap: async function(){
		try{
			this.parent.pushStory('#log_modal_form');
			$('#log_modal_form').modal('hide');
			$(".loader").fadeIn();
			
			const geoips = [];
			const doc = JSON.parse(this.getDoc()._content);
			for(let i=0;i<doc.ips.length;i++){		
				const g = await this.service_geoip({ip: doc.ips[i]});
				geoips.push({lat: g.ll[0], lng: g.ll[1]});
			}
			console.log(geoips);
			
			this.parent.map.open();
			await this.parent.map.wait(1000);
			this.parent.map.refresh();
			this.parent.map.loadMarkers(geoips);
			
			$(".loader").fadeOut();
		}catch(e){
			alert(e);
		}
	}
});
