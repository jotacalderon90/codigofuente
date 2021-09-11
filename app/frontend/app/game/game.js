app.modules.game = new trascender({
	properties: {
		name: "game", 
		label: "Juego", 
		icon: "fa-gamepad"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		this.started = false;
	},
	start: function(){
		
	},
	open: function(){
		$("#game_modal_main").modal("show");
		if(!this.started){
			this.firsOpen();
		}
	},
	firsOpen: async function(){
		$('.loader').fadeIn();
		
		this.started = true;
		
		this.icons = await this.loadIcons();
		
		this.rows = 9;
		this.cols = 15;
		this.width = $('#game_cv').width();
		this.square = this.width / this.cols;
		
		this.canvas = document.getElementById("game_cv");
		this.canvas.width = (this.cols) * this.square;
		this.canvas.height = (this.rows) * this.square;
		
		this.ctx = this.canvas.getContext("2d");
		
		this.load();
		this.canvas.addEventListener("click", (event)=>{this.canvasClick(event);});
		this.canvas.addEventListener("contextmenu", (event)=>{this.canvasClick2(event);});
		$("#BTN_AWAIT").click(()=>{this.btnWait()});
		$("#BTN_BUILD").click(()=>{this.btnBuild()});
		$("#BTN_FINISH").click(()=>{this.btnFinish()});
		$("#BTN_CREATE_UNIT").click(()=>{this.btnCreateUnit()});	
		
		$('.loader').fadeOut();
	},
	
	loadIcons: function(){
		return new Promise((resolve, reject)=>{
			try{		
				const src = {
					LLANO: "assets/media/img/game/board_llano.png",
					MOUNTAIN: "assets/media/img/game/board_mountain.png",
					FOREST: "assets/media/img/game/board_forest.png",
					METEORITE: "assets/media/img/game/board_meteorite.png",
					//BUILDER: "assets/media/img/game/board_icon03.png",
					//HOUSE: "assets/media/img/game/board_icon04.png",
					MAINBASE_PLAYER1: "assets/media/img/game/building_baseprincipalP1.png",
					MAINBASE_PLAYER2: "assets/media/img/game/building_baseprincipalP2.png",
					BARRACK_PLAYER1: "assets/media/img/game/building_barrackP1.png",
					BARRACK_PLAYER2: "assets/media/img/game/building_barrackP2.png",
					WHILE_PLAYER1: "assets/media/img/game/building_whileP1.png",
					WHILE_PLAYER2: "assets/media/img/game/building_whileP2.png",
					FACTORY_PLAYER1: "assets/media/img/game/building_factoryP1.png",
					FACTORY_PLAYER2: "assets/media/img/game/building_factoryP2.png",
					OFFICES_PLAYER1: "assets/media/img/game/building_officesP1.png",
					OFFICES_PLAYER2: "assets/media/img/game/building_officesP2.png",
					STRATEGICR_PLAYER1: "assets/media/img/game/building_srP1.png",
					STRATEGICR_PLAYER2: "assets/media/img/game/building_srP2.png",
					WORKER_PLAYER1: "assets/media/img/game/unit_workerP1.png",
					WORKER_PLAYER2: "assets/media/img/game/unit_workerP2.png",
					//UNIT_PLAYER1: "assets/media/img/game/unit_fusilP1.png",
					//UNIT_PLAYER2: "assets/media/img/game/unit_workerP1.png",
					STEP: "assets/media/img/game/board_step.png",
					TEMPO1: "assets/media/img/game/tempo1.png",
					TEMPO2: "assets/media/img/game/tempo2.png",
					TEMPO3: "assets/media/img/game/tempo3.png",
					TEMPO4: "assets/media/img/game/tempo4.png",
					WORKER_PLAYER1_WAIT: "assets/media/img/game/unitUsed_workerP1.png",
					WORKER_PLAYER2_WAIT: "assets/media/img/game/unitUsed_workerP2.png"
				};
				const icons = {};
				var icons_cant = 0;
				var icons_loaded = 0;
				const onload = function(img,type){
					return function(){
						icons[type] = img;
						icons_loaded++;
						if(icons_loaded==icons_cant){
							resolve(icons);
						}
					}
				}
				for(img in src){
					icons_cant++;
				}
				for(img in src){
					let image = new Image();
					image.onload = onload(image,img);
					image.src = src[img];
				}
			}catch(e){
				reject(e);
			}
		});
	},
	insertIMG: function(y,x,type){
		this.ctx.drawImage(this.icons[type], y, x, this.square, this.square);
	},
	variables: {
		LLANO: {
			RESISTENCIA: 0
		},
		FOREST: {
			RESISTENCIA: 1
		},
		MOUNTAIN: {
			RESISTENCIA: 2
		},
		WORKER_PLAYER1: {
			STEP: 2,
			COSTO: 1,
			ACTIONS: {
				BUILD: "",
				AWAIT: ""
			}
		},
		WORKER_PLAYER2: {
			STEP: 2,
			COSTO: 1,
			ACTIONS: {
				BUILD: "",
				AWAIT: ""
			}
		},
		BARRACK_PLAYER1: {
			RESISTENCIA: 0,
			TURN: 2,
			MONEY: 1,
			COSTO: 2,
			ACTIONS: {
				CREATE_UNIT: ""
			}
		},
		BARRACK_PLAYER2: {
			RESISTENCIA: 0,
			TURN: 2,
			MONEY: 1,
			COSTO: 2,
			ACTIONS: {
				CREATE_UNIT: ""
			}
		},
		WHILE_PLAYER1: {
			CURRENT: 0
		},
		WHILE_PLAYER2: {
			CURRENT: 0
		},
		MAINBASE_PLAYER1: {
			MONEY: 2
		},
		MAINBASE_PLAYER2: {
			MONEY: 2
		},
		WORKER_PLAYER1_WAIT: {},
		WORKER_PLAYER2_WAIT: {}
	},
	newElement: function(type, y, x, player) {
		const e = {};
		e.type = type;
		e.player = player;
		for (variable in this.variables[type]) {
			e[variable] = this.variables[type][variable];
		}
		this.insertIMG(y,x,type);
		return e;
	},
	load: function(){
		this.printBoard();
		
		const urlParams = new URLSearchParams(window.location.search);
		if(urlParams.get('gameid')!=null){
			this.printSaved(urlParams.get('gameid'))
			this.myPlayer = 2;
		}else{
			this.printMainBase();
			this.printMeteorite();
			this.printForest();
			this.printMountains();
			this.printUnits();
			
			this.printMirror();
			this.printMiddle();
			
			this.myPlayer = 1;
			
		}
		
		this.currentPlayer = 1;

		this.moneyPlayer1 = 0;
		this.moneyPlayer2 = 0;

		this.setClickeables();
		this.cleanStep();
		this.economy();

		//$("button").hide();
		this.btnHide();
		$("#BTN_FINISH").show();
		
		this.indexBoardSelected;
		this.waitForAction = false;

		this.refreshInfo();
	},
	getNine: function(x, i) {
		let nine = [];
		x--;
		i--;
		for (let z = x; z < (x + 3); z++) {
			for (let y = i; y < (i + 3); y++) {
				if (z == (x + 1) && y == (i + 1)) {
					
				} else {
					nine.push([z, y]);
				}
			}
		}
		return nine;
	},
	getCross: function(x, y, step) {
		let steps = [];
		let U, D, L, R;
		U = [x - step, y]
		steps.push(U);
		R = [x, y + step];
		steps.push(R);
		D = [x + step, y];
		steps.push(D);
		L = [x, y - step];
		steps.push(L);
		return steps;
	},
	getDiamond: function(cross) {
		let r = [];
		let TRAZO = [cross[0][0],cross[0][1]];
		let U = cross[0];
		let R = cross[1];
		let D = cross[2];
		let L = cross[3];

		//DIAGONAL U-R
		while (TRAZO[0] != R[0] && TRAZO[1] != R[1]) {
			TRAZO[0] = TRAZO[0] + 1;
			TRAZO[1] = TRAZO[1] + 1
			r.push([TRAZO[0], TRAZO[1]]);
		}
		r.splice(r.length - 1, 1);

		//DIAGONAL R-D
		while (TRAZO[0] != D[0] && TRAZO[1] != D[1]) {
			TRAZO[0] = TRAZO[0] + 1;
			TRAZO[1] = TRAZO[1] - 1
			r.push([TRAZO[0], TRAZO[1]]);
		}
		r.splice(r.length - 1, 1);
		

		//DIAGONAL D-L
		while (TRAZO[0] != L[0] && TRAZO[1] != L[1]) {
			TRAZO[0] = TRAZO[0] - 1;
			TRAZO[1] = TRAZO[1] - 1;
			r.push([TRAZO[0], TRAZO[1]]);
		}
		r.splice(r.length - 1, 1);

		//DIAGONAL L-U
		while(TRAZO[0]!=U[0] && TRAZO[1]!=U[1]){
			TRAZO[0] = TRAZO[0]-1;
			TRAZO[1] = TRAZO[1]+1;
			r.push([TRAZO[0],TRAZO[1]]);
		}
		r.splice(r.length - 1, 1);

		return r;
	},
	getResistence: function(obj){
		let r = 0;
		for(let i=0;i<obj.elementos.length;i++){
			if(obj.elementos[i].RESISTENCIA){
				r += obj.elementos[i].RESISTENCIA;
			}
		}
		return r;
	},
	hasElement: function(obj, element){
		for(let i=0;i<obj.elementos.length;i++){
			if(obj.elementos[i].type==element){
				return true;
			}
		}
		return false;
	},
	getDefaultBoard: function(){
		return {MainBase_position:0,board:[[{"x":0,"y":0,"coordenada":[0,0],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MAINBASE_PLAYER1","player":1,"MONEY":2}]},{"x":0,"y":21.244466666666664,"coordenada":[0,1],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":42.48893333333333,"coordenada":[0,2],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"WORKER_PLAYER1","player":1,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":0,"y":63.73339999999999,"coordenada":[0,3],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":84.97786666666666,"coordenada":[0,4],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":106.22233333333332,"coordenada":[0,5],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":127.46679999999998,"coordenada":[0,6],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":148.71126666666666,"coordenada":[0,7],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":0,"y":169.9557333333333,"coordenada":[0,8],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":191.20019999999997,"coordenada":[0,9],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":212.44466666666665,"coordenada":[0,10],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":0,"y":233.6891333333333,"coordenada":[0,11],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":254.93359999999996,"coordenada":[0,12],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":0,"y":276.1780666666666,"coordenada":[0,13],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":0,"y":297.4225333333333,"coordenada":[0,14],"elementos":[{"type":"LLANO","RESISTENCIA":0}]}],[{"x":21.244466666666664,"y":0,"coordenada":[1,0],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":21.244466666666664,"coordenada":[1,1],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":42.48893333333333,"coordenada":[1,2],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":63.73339999999999,"coordenada":[1,3],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":21.244466666666664,"y":84.97786666666666,"coordenada":[1,4],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":106.22233333333332,"coordenada":[1,5],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":21.244466666666664,"y":127.46679999999998,"coordenada":[1,6],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":148.71126666666666,"coordenada":[1,7],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":169.9557333333333,"coordenada":[1,8],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":191.20019999999997,"coordenada":[1,9],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":21.244466666666664,"y":212.44466666666665,"coordenada":[1,10],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":21.244466666666664,"y":233.6891333333333,"coordenada":[1,11],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":21.244466666666664,"y":254.93359999999996,"coordenada":[1,12],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":21.244466666666664,"y":276.1780666666666,"coordenada":[1,13],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":21.244466666666664,"y":297.4225333333333,"coordenada":[1,14],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]}],[{"x":42.48893333333333,"y":0,"coordenada":[2,0],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":21.244466666666664,"coordenada":[2,1],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1},{"type":"WORKER_PLAYER1","player":1,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":42.48893333333333,"y":42.48893333333333,"coordenada":[2,2],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"BARRACK_PLAYER1","player":1,"RESISTENCIA":0,"TURN":2,"MONEY":1,"COSTO":2,"ACTIONS":{"CREATE_UNIT":""}},{"type":"WORKER_PLAYER1","player":1,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":42.48893333333333,"y":63.73339999999999,"coordenada":[2,3],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":84.97786666666666,"coordenada":[2,4],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":106.22233333333332,"coordenada":[2,5],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":127.46679999999998,"coordenada":[2,6],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":148.71126666666666,"coordenada":[2,7],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":42.48893333333333,"y":169.9557333333333,"coordenada":[2,8],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":191.20019999999997,"coordenada":[2,9],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":42.48893333333333,"y":212.44466666666665,"coordenada":[2,10],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":233.6891333333333,"coordenada":[2,11],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":42.48893333333333,"y":254.93359999999996,"coordenada":[2,12],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":42.48893333333333,"y":276.1780666666666,"coordenada":[2,13],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":42.48893333333333,"y":297.4225333333333,"coordenada":[2,14],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]}],[{"x":63.73339999999999,"y":0,"coordenada":[3,0],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":21.244466666666664,"coordenada":[3,1],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":42.48893333333333,"coordenada":[3,2],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":63.73339999999999,"y":63.73339999999999,"coordenada":[3,3],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":84.97786666666666,"coordenada":[3,4],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":106.22233333333332,"coordenada":[3,5],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":63.73339999999999,"y":127.46679999999998,"coordenada":[3,6],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":63.73339999999999,"y":148.71126666666666,"coordenada":[3,7],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":169.9557333333333,"coordenada":[3,8],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":63.73339999999999,"y":191.20019999999997,"coordenada":[3,9],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":212.44466666666665,"coordenada":[3,10],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":63.73339999999999,"y":233.6891333333333,"coordenada":[3,11],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":63.73339999999999,"y":254.93359999999996,"coordenada":[3,12],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":63.73339999999999,"y":276.1780666666666,"coordenada":[3,13],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":63.73339999999999,"y":297.4225333333333,"coordenada":[3,14],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"METEORITE"}]}],[{"x":84.97786666666666,"y":0,"coordenada":[4,0],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":84.97786666666666,"y":21.244466666666664,"coordenada":[4,1],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":84.97786666666666,"y":42.48893333333333,"coordenada":[4,2],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":84.97786666666666,"y":63.73339999999999,"coordenada":[4,3],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":84.97786666666666,"y":84.97786666666666,"coordenada":[4,4],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":84.97786666666666,"y":106.22233333333332,"coordenada":[4,5],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":84.97786666666666,"y":127.46679999999998,"coordenada":[4,6],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"WORKER_PLAYER1","player":1,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":84.97786666666666,"y":148.71126666666666,"coordenada":[4,7],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"METEORITE"}]},{"x":84.97786666666666,"y":169.9557333333333,"coordenada":[4,8],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"WORKER_PLAYER2","player":2,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":84.97786666666666,"y":191.20019999999997,"coordenada":[4,9],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":84.97786666666666,"y":212.44466666666665,"coordenada":[4,10],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":84.97786666666666,"y":233.6891333333333,"coordenada":[4,11],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":84.97786666666666,"y":254.93359999999996,"coordenada":[4,12],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":84.97786666666666,"y":276.1780666666666,"coordenada":[4,13],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":84.97786666666666,"y":297.4225333333333,"coordenada":[4,14],"elementos":[{"type":"LLANO","RESISTENCIA":0}]}],[{"x":106.22233333333332,"y":0,"coordenada":[5,0],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"METEORITE"}]},{"x":106.22233333333332,"y":21.244466666666664,"coordenada":[5,1],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":106.22233333333332,"y":42.48893333333333,"coordenada":[5,2],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":106.22233333333332,"y":63.73339999999999,"coordenada":[5,3],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":106.22233333333332,"y":84.97786666666666,"coordenada":[5,4],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":106.22233333333332,"y":106.22233333333332,"coordenada":[5,5],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":106.22233333333332,"y":127.46679999999998,"coordenada":[5,6],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":106.22233333333332,"y":148.71126666666666,"coordenada":[5,7],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":106.22233333333332,"y":169.9557333333333,"coordenada":[5,8],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":106.22233333333332,"y":191.20019999999997,"coordenada":[5,9],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":106.22233333333332,"y":212.44466666666665,"coordenada":[5,10],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":106.22233333333332,"y":233.6891333333333,"coordenada":[5,11],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":106.22233333333332,"y":254.93359999999996,"coordenada":[5,12],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":106.22233333333332,"y":276.1780666666666,"coordenada":[5,13],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":106.22233333333332,"y":297.4225333333333,"coordenada":[5,14],"elementos":[{"type":"LLANO","RESISTENCIA":0}]}],[{"x":127.46679999999998,"y":0,"coordenada":[6,0],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":127.46679999999998,"y":21.244466666666664,"coordenada":[6,1],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":42.48893333333333,"coordenada":[6,2],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":127.46679999999998,"y":63.73339999999999,"coordenada":[6,3],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":127.46679999999998,"y":84.97786666666666,"coordenada":[6,4],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":106.22233333333332,"coordenada":[6,5],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":127.46679999999998,"y":127.46679999999998,"coordenada":[6,6],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":148.71126666666666,"coordenada":[6,7],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":127.46679999999998,"y":169.9557333333333,"coordenada":[6,8],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":191.20019999999997,"coordenada":[6,9],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":212.44466666666665,"coordenada":[6,10],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":233.6891333333333,"coordenada":[6,11],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":127.46679999999998,"y":254.93359999999996,"coordenada":[6,12],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"BARRACK_PLAYER2","player":2,"RESISTENCIA":0,"TURN":2,"MONEY":1,"COSTO":2,"ACTIONS":{"CREATE_UNIT":""}},{"type":"WORKER_PLAYER2","player":2,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":127.46679999999998,"y":276.1780666666666,"coordenada":[6,13],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1},{"type":"WORKER_PLAYER2","player":2,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":127.46679999999998,"y":297.4225333333333,"coordenada":[6,14],"elementos":[{"type":"LLANO","RESISTENCIA":0}]}],[{"x":148.71126666666666,"y":0,"coordenada":[7,0],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":148.71126666666666,"y":21.244466666666664,"coordenada":[7,1],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":42.48893333333333,"coordenada":[7,2],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":148.71126666666666,"y":63.73339999999999,"coordenada":[7,3],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":148.71126666666666,"y":84.97786666666666,"coordenada":[7,4],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":148.71126666666666,"y":106.22233333333332,"coordenada":[7,5],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":148.71126666666666,"y":127.46679999999998,"coordenada":[7,6],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":148.71126666666666,"coordenada":[7,7],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":169.9557333333333,"coordenada":[7,8],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":191.20019999999997,"coordenada":[7,9],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":148.71126666666666,"y":212.44466666666665,"coordenada":[7,10],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":233.6891333333333,"coordenada":[7,11],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":148.71126666666666,"y":254.93359999999996,"coordenada":[7,12],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":276.1780666666666,"coordenada":[7,13],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":148.71126666666666,"y":297.4225333333333,"coordenada":[7,14],"elementos":[{"type":"LLANO","RESISTENCIA":0}]}],[{"x":169.9557333333333,"y":0,"coordenada":[8,0],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":21.244466666666664,"coordenada":[8,1],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":169.9557333333333,"y":42.48893333333333,"coordenada":[8,2],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":63.73339999999999,"coordenada":[8,3],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":84.97786666666666,"coordenada":[8,4],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MOUNTAIN","RESISTENCIA":2}]},{"x":169.9557333333333,"y":106.22233333333332,"coordenada":[8,5],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":127.46679999999998,"coordenada":[8,6],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":148.71126666666666,"coordenada":[8,7],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"FOREST","RESISTENCIA":1}]},{"x":169.9557333333333,"y":169.9557333333333,"coordenada":[8,8],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":191.20019999999997,"coordenada":[8,9],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":212.44466666666665,"coordenada":[8,10],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":233.6891333333333,"coordenada":[8,11],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":254.93359999999996,"coordenada":[8,12],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"WORKER_PLAYER2","player":2,"STEP":2,"COSTO":1,"ACTIONS":{"BUILD":"","AWAIT":""}}]},{"x":169.9557333333333,"y":276.1780666666666,"coordenada":[8,13],"elementos":[{"type":"LLANO","RESISTENCIA":0}]},{"x":169.9557333333333,"y":297.4225333333333,"coordenada":[8,14],"elementos":[{"type":"LLANO","RESISTENCIA":0},{"type":"MAINBASE_PLAYER2","player":2,"MONEY":2}]}]]};
	},
	printBoard: function(){
		this.board = new Array(this.rows);
		for (let x = 0; x < this.board.length; x++) {
			this.board[x] = new Array(this.cols);
			for (let y = 0; y < this.board[x].length; y++) {
				this.board[x][y] = {
					x: (x * this.square),
					y: (y * this.square),
					coordenada: [x, y],
					elementos: [this.newElement("LLANO", (y * this.square), (x * this.square))]
				};
			}
		}
	},
	printSaved: function(gameid){
		const b = this.getDefaultBoard();
		this.MainBase_position = b.MainBase_position;
		for(let i=0;i<b.board.length;i++){
			for(let x=0;x<b.board[i].length;x++){
				for(let e=1;e<b.board[i][x].elementos.length;e++){
					this.board[i][x].elementos.push(this.newElement(b.board[i][x].elementos[e].type,this.board[i][x].y,this.board[i][x].x,b.board[i][x].elementos[e].player));
				}
			}
		}
	},
	printMainBase: function(){
		let r = (Math.floor(Math.random() * 3));
		r = (r == 0) ? 0 : (r == 1) ? 4 : (r == 2) ? 8 : r;
		this.board[r][0].elementos.push(this.newElement("MAINBASE_PLAYER1", this.board[r][0].y, this.board[r][0].x, 1));
		this.MainBase_position = r;

		if (r == 0) {
			this.board[2][2].elementos.push(this.newElement("BARRACK_PLAYER1", this.board[r+2][2].y, this.board[r+2][2].x, 1));
		}
		else if (r == 4) {
			this.board[r][2].elementos.push(this.newElement("BARRACK_PLAYER1", this.board[r][2].y, this.board[r][2].x, 1));
		}
		else if (r == 8){
			this.board[6][2].elementos.push(this.newElement("BARRACK_PLAYER1", this.board[r-2][2].y, this.board[r-2][2].x, 1));
		}
	},
	printMeteorite: function(){
		let meteorites = [];
		for (let x = 0; x < this.rows; x++) {
			for (let i = 0; i <= 6; i++) {
				if (this.board[x][i].elementos.length == 1) {
					let n = (this.getNine(x, i));
					let hasSome = false;
					for (let z = 0; z < n.length; z++) {
						if (n[z][0] >= 0 && n[z][1] >= 0 && this.board[n[z][0]] && this.board[n[z][0]][n[z][1]]) {
							if (this.board[n[z][0]][n[z][1]].elementos.length != 1) {
								hasSome = true;
							}
						}
					}
					if (!hasSome) {
						meteorites.push([x, i]);
					}
				}
			}
		}
		let selected = [];
		while (selected.length != 1) {
			let aux = (Math.floor(Math.random() * (meteorites.length)));
			if (selected.indexOf(aux) == -1) {
				selected.push(aux);
			}
		}
		for (let i = 0; i < selected.length; i++) {
			let obj = this.board[meteorites[selected[i]][0]][meteorites[selected[i]][1]];
			obj.elementos.push(this.newElement("METEORITE", obj.y, obj.x));
		}
	},
	printForest: function(){
		let spaces = [];
		for (let x = 0; x < this.rows; x++) {
			for (let i = 0; i <= 6; i++) {
				if (this.board[x][i].elementos.length == 1) {
					spaces.push([x, i]);
				}
			}
		}
		let forest = Math.floor(((this.rows * (Math.floor(this.cols / 2))) * 25) / 100);
		selected = [];
		while (selected.length != forest) {
			let aux = (Math.floor(Math.random() * (spaces.length)));
			if (selected.indexOf(aux) == -1) {
				selected.push(aux);
			}
		}
		for (let i = 0; i < selected.length; i++) {
			let obj = this.board[spaces[selected[i]][0]][spaces[selected[i]][1]];
			obj.elementos.push(this.newElement("FOREST", obj.y, obj.x));
		}
	},
	printMountains: function(){
		spaces = [];
		for (let x = 0; x < this.rows; x++) {
			for (let i = 0; i < 6; i++) {
				if (this.board[x][i].elementos.length == 1) {
					spaces.push([x, i]);
				}
			}
		}
		let mountain = Math.floor(((this.rows * Math.floor(this.cols / 2)) * 15) / 100);
		selected = [];
		while (selected.length != mountain) {
			let aux = (Math.floor(Math.random() * (spaces.length)));
			if (selected.indexOf(aux) == -1) {
				selected.push(aux);
			}
		}
		for (let i = 0; i < selected.length; i++) {
			let obj = this.board[spaces[selected[i]][0]][spaces[selected[i]][1]];
			obj.elementos.push(this.newElement("MOUNTAIN", obj.y, obj.x));
		}
	},
	printUnits: function(){
		let unit = [];
		switch (this.MainBase_position) {
			case 0:
				unit = [
					[0, 2],
					[1, 1],
					[1, 2],
					[2, 0],
					[2, 1],
					[2, 2]
				];
				break;
			case 4:
				unit = [
					[3, 1],
					[3, 2],
					[4, 2],
					[5, 1],
					[5, 2]
				];
				break;
			case 8:
				unit = [
					[6, 0],
					[6, 1],
					[6, 2],
					[7, 1],
					[7, 2],
					[8, 2]
				];
				break;
		}

		selected = [];
		while (selected.length != 3) {
			let aux = (Math.floor(Math.random() * (unit.length)));
			if (selected.indexOf(aux) == -1) {
				selected.push(aux);
			}
		}
		for (let i = 0; i < selected.length; i++) {
			let obj = this.board[unit[selected[i]][0]][unit[selected[i]][1]];
			obj.elementos.push(this.newElement("WORKER_PLAYER1", obj.y, obj.x, 1));
		}

		this.board[4][6].elementos.push(this.newElement("WORKER_PLAYER1", this.board[4][6].y, this.board[4][6].x, 1)); 
	},
	printMirror: function(){
		//var cont = 0;
		for (let x = 0; x < this.rows; x++) {
			for (let i = 0; i <= 6; i++) {
				if (this.board[x][i].elementos.length > 1) {
					let obj = this.board[(this.rows - x) - 1][(this.cols - i) - 1];
					for (let z = 1; z < this.board[x][i].elementos.length; z++) {
						let aux = this.board[x][i].elementos[z];
						if (aux.player == 1) {
							obj.elementos.push(this.newElement(aux.type.replace("1", "2"), obj.y, obj.x, 2));
						} else {
							obj.elementos.push(this.newElement(aux.type, obj.y, obj.x));
						}
					}
				}
			}
		}
	},
	printMiddle: function(){
		let mf = Math.floor(this.rows / 2);
		let mc = Math.floor(this.cols / 2);
		//board[mf-1][mc].elementos.push(this.newElement("HOUSE",board[mf-1][mc].y,board[mf-1][mc].x));
		//board[mf+1][mc].elementos.push(this.newElement("HOUSE",board[mf+1][mc].y,board[mf+1][mc].x));
		this.board[mf][mc].elementos.push(this.newElement("METEORITE", this.board[mf][mc].y, this.board[mf][mc].x));

		//testeo
		let mid = [];
		mid = [ [0,mc],[1,mc],[2,mc],[3,mc] ];
		
		selected = [];
		while (selected.length != 2) {
			let aux = (Math.floor(Math.random() * (mid.length)));
			if (selected.indexOf(aux) == -1) {
				selected.push(aux);
			}
		}
		for (let i = 0; i < selected.length; i++) {
			let obj = this.board[mid[selected[i]][0]][mid[selected[i]][1]];
			obj.elementos.push(this.newElement("FOREST", obj.y, obj.x));
		}
		
		for (let x = 0; x <= 3; x++) {
				if (this.board[x][mc].elementos.length > 1) {
					let obj = this.board[(this.rows - x)-1][mc];
					for (let z = 1; z < this.board[x][mc].elementos.length; z++) {
						let aux = this.board[x][mc].elementos[z];
						obj.elementos.push(this.newElement(aux.type, obj.y, obj.x));
						
					}
				}
		}
	},
	repint: function(obj){
		for (let x = 0; x < obj.elementos.length; x++) {
			this.insertIMG(obj.y, obj.x, obj.elementos[x].type);
		}
	},
	setClickeables: function(){
		this.clickeables = [];
		for (f in this.board) {
			for (c in this.board[f]) {
				let hasClick = false;
				for (let i = 0; i < this.board[f][c].elementos.length; i++) {
					if (this.board[f][c].elementos[i].player == this.currentPlayer) {
						hasClick = true;
					}
				}
				if (hasClick) {
					this.clickeables.push(this.board[f][c]);
				}
			}
		}
	},
	setClicked: function(x,y){
		this.indexSelected = -1;
		this.clicked = null;
		this.clickeables.forEach((obj)=>{
			this.indexSelected++;
			if (y >= (obj.y) && y <= (obj.y + this.square) && x >= obj.x && x <= (obj.x + this.square)) {
				this.indexBoardSelected = this.indexSelected;
				this.clicked = obj;
				console.log(obj);
			}
		});
	},
	cleanStep: function() {
		if(this.steps){
			for (let i = 0; i < this.steps.length; i++) {
				let c = this.steps[i];
				let b = this.board[c[0]][c[1]];
				b.elementos.splice(b.elementos.length - 1, 1);
				this.repint(b);
			}
		}	
		this.steps = [];
	},
	getSteps: function(obj,step){
		let boardToStep = [];
		let stepB = new Number(step)
		let cross = this.getCross(obj.coordenada[0], obj.coordenada[1], 1);
		for(let i=0;i<cross.length;i++){
			if (this.board[cross[i][0]]) {
				if (this.board[cross[i][0]][cross[i][1]]) {
					let c = this.board[cross[i][0]][cross[i][1]];
					let r = this.getResistence(c);
					if(step > r){
						boardToStep.push(c);
						step--;
						if(step - r > 0){
							boardToStep = boardToStep.concat(this.getSteps(c,step))
						}
					}
				}
			}
			step = stepB;
		}
		return boardToStep;
	},
	setSteps: function(obj,unit){
		let boardToStep = this.getSteps(obj,unit.STEP);
		boardToStep = boardToStep.concat(obj);
		let boardToStepUnique = [];
		for(let i=0; i<boardToStep.length;i++){
			let c = boardToStep[i];
			if(!this.hasElement(c,"STEP") && !this.hasElement(c,"WORKER_PLAYER" +  + this.currentPlayer)){
				this.steps.push(c.coordenada);
				c.elementos.push(this.newElement("STEP", c.y, c.x));
				boardToStepUnique.push(c);
			}
		}
		//agregar unidad seleccionada
		obj.elementos.push(this.newElement("STEP", obj.y, obj.x));
		this.steps.push(obj.coordenada);
		boardToStepUnique = boardToStepUnique.concat(obj);
		this.stepClickeable = boardToStepUnique;
		this.boardSelected = obj;
	},
	indexElement: function(obj,type){
		let index = -1;
		for(let i=0;i<obj.elementos.length;i++){
			if(obj.elementos[i].type==type){
				index = i;
			}
		}
		return index;
	},
	economy: function(){
		for(let i=0;i<this.clickeables.length;i++){
			let c = this.clickeables[i];
			for(let x=0;x<c.elementos.length;x++){
				let e = c.elementos[x];
				if(e.MONEY!=null && e.MONEY!=undefined){
					this["moneyPlayer" + this.currentPlayer] += e.MONEY;
				}
			}
		}
	},
	update: function(){
		for(let i=0;i<this.clickeables.length;i++){
			let c = this.clickeables[i];
			for(let x=0;x<c.elementos.length;x++){
				let e = c.elementos[x];
				if(e.CURRENT!=null && e.CURRENT!=undefined){
					e.CURRENT++;
					if(e.CURRENT == this.variables[e.BUILD].TURN){
						let iw = this.indexElement(c,"WHILE_PLAYER" + this.currentPlayer);
						c.elementos[iw] = this.newElement(e.BUILD, c.y, c.x,this.currentPlayer);
						
						let it = this.indexElement(c,"TEMPO1");
						c.elementos.splice(it,1);
						
						this.repint(c);
					}
				}
			}
		}
	},
	printTEMPO: function(c){
		if(c){
			for(let x=0;x<c.elementos.length;x++){
				let e = c.elementos[x];
				if(e.CURRENT!=null && e.CURRENT!=undefined){
					let t = this.variables[e.BUILD].TURN - e.CURRENT;
					c.elementos.push(this.newElement("TEMPO" + t, c.y, c.x,this.currentPlayer));
				}
			}
		}else{
			for(let i=0;i<this.clickeables.length;i++){
				c = this.clickeables[i];
				for(let x=0;x<c.elementos.length;x++){
					let e = c.elementos[x];
					if(e.CURRENT!=null && e.CURRENT!=undefined){
						let t = this.variables[e.BUILD].TURN - e.CURRENT;
						
						let it = this.indexElement(c,"TEMPO" + (t + 1));
						c.elementos.splice(it,1);
						c.elementos.push(this.newElement("TEMPO" + t, c.y, c.x,this.currentPlayer));
						
					}
				}
			}
		}	
	},
	move: function(x,y){
		let selectOk = false;
		this.stepClickeable.forEach((obj)=>{
			if (y >= (obj.y) && y <= (obj.y + this.square) && x >= obj.x && x <= (obj.x + this.square)) {

				selectOk = true;

				//rescatar unidad
				let unit = this.boardSelected.elementos[this.boardSelected.elementos.length-1];

				//eliminar elemento del objeto
				this.boardSelected.elementos.splice(this.boardSelected.elementos.length - 1, 1);
				this.repint(this.boardSelected);
				
				//eliminar de los clickeables si no tiene barraca
				let ib = this.indexElement(this.boardSelected,"BARRACK_PLAYER" + this.currentPlayer);
				if(ib==-1){
					this.backuprmclicked = true;
					this.clickeables.splice(this.indexBoardSelected,1);
				}else{
					this.backuprmclicked = false;
				}
				
				//agregar backup para cancelar accion
				this.backup = this.boardSelected;

				//agregar el objeto
				obj.elementos.push(unit);
				this.insertIMG(obj.y, obj.x, unit.type);
				
				//activar botones
				for(action in unit.ACTIONS){
					$("#BTN_" + action).removeAttr("disabled");
				}
				
				this.boardSelected = false;
				this.waitForAction = true;
				this.current = obj;
				
			} 
		});

		if(!selectOk){
			this.boardSelected = false;
		}
	},
	canvasClick: function(event){	
	
		if(this.currentPlayer != this.myPlayer){
			return;
		}
		
		if(!this.waitForAction){
			let x = event.layerY;
			let y = event.layerX;
			
			x -= this.canvas.offsetTop;
			y -= this.canvas.offsetLeft;
			
			this.cleanStep();
			if(!this.boardSelected){
				this.setClicked(x,y);
				if(this.clicked!=null){
					let unit = this.clicked.elementos.filter((row)=>{
						return row.type === "WORKER_PLAYER" + this.currentPlayer;
					})[0];
					if(unit){
						//selecciono unidad
						this.setSteps(this.clicked,unit);
					}else{
						//selecciono edificio
						let b = this.clicked.elementos[this.clicked.elementos.length-1];
						//activar botones
						for(action in b.ACTIONS){
							$("#BTN_" + action).removeAttr("disabled");
						}
						this.boardSelected = false;
						this.waitForAction = true;
						this.current = this.clicked;
					}
				}
			}else{
				this.move(x,y);
			}
		}else{
			alert("ESPERANDO POR ACCION DE LA UNIDAD");
		}
	},
	canvasClick2: function(event){
		event.preventDefault();
		
		if(this.currentPlayer != this.myPlayer){
			return;
		}
		
		if(this.waitForAction){
			if(confirm("¿Esta seguro de cancelar la acción?")){
				
				//rescatar unidad
				let unit = this.current.elementos[this.current.elementos.length-1];
				
				//eliminar nueva posicion
				this.current.elementos.splice(this.current.elementos.length - 1, 1);
				this.repint(this.current);
				
				//restaurar en posicion previa
				this.backup.elementos.push(unit);
				this.insertIMG(this.backup.y, this.backup.x, unit.type);
				
				if(this.backuprmclicked){
					this.clickeables.push(this.backup);
				}
				
				this.boardSelected = false;
				this.waitForAction = false;
			}
		}
	},
	btnWait: function(){
		this.insertIMG(this.current.y, this.current.x, "WORKER_PLAYER" + this.currentPlayer + "_WAIT");
		this.waitForAction = false;
		
		console.log('actualizar en otro usuario');
		console.log(this.current);
				
		this.btnHide();
	},
	btnBuild: function(){
		//abrir menu de seleccion
		this.waitForAction = false;
		if(this.current.elementos.length!=2){
			alert("no se puede");
		}else if(this["moneyPlayer" + this.currentPlayer] >= this.variables["BARRACK_PLAYER" + this.currentPlayer].COSTO){
			this.current.elementos.splice(this.current.elementos.length-1,1);
			
			this.repint(this.current);
			this.current.elementos.push (this.newElement("WHILE_PLAYER" + this.currentPlayer, this.current.y, this.current.x,this.currentPlayer));
			this.current.elementos[this.current.elementos.length-1].BUILD = "BARRACK_PLAYER" + this.currentPlayer;
			this.btnHide();
			
			this.printTEMPO(this.current);
			
			//actualiza monedas
			this["moneyPlayer" + this.currentPlayer] -= this.variables["BARRACK_PLAYER" + this.currentPlayer].COSTO;
			console.log('actualizar en otro usuario');
			console.log(this.current);
		}else{
			alert("no hay money");
		}
		this.refreshInfo();
	},
	btnCreateUnit: function(){
		//abrir menu de seleccion
		if(this["moneyPlayer" + this.currentPlayer] >= this.variables["WORKER_PLAYER" + this.currentPlayer].COSTO){
			this.current.elementos.push (this.newElement("WORKER_PLAYER" + this.currentPlayer, this.current.y, this.current.x,this.currentPlayer));
			this.insertIMG(this.current.y, this.current.x, "WORKER_PLAYER" + this.currentPlayer + "_WAIT");
			this.clickeables.splice(this.indexBoardSelected,1);
			this.waitForAction = false;
			this.btnHide();

			this["moneyPlayer" + this.currentPlayer] = this["moneyPlayer" + this.currentPlayer] - this.variables["WORKER_PLAYER" + this.currentPlayer].COSTO;
			
			console.log('actualizar en otro usuario');
			console.log(this.current);
		
		}else{
			console.log("no hay money");
		}
		console.log(this["moneyPlayer" + this.currentPlayer]);
		this.refreshInfo();
	},
	btnFinish: function(){
		this.boardSelected = false;
		this.waitForAction = false;
		this.currentPlayer = (this.currentPlayer==1)?2:1;
		this.setClickeables();
		this.cleanStep();
		this.economy();
		this.update();
		this.printTEMPO();
		this.refreshInfo();
		
		for(let i=0;i<this.clickeables.length;i++){
			let c = this.clickeables[i];
			this.repint(c);
		}
		
		$("#BTN_FINISH").attr("disabled","disabled");
		//cambiar de usado a normal, para las unidades
	},
	btnHide: function(){
		$("#BTN_AWAIT").attr("disabled","disabled");
		$("#BTN_BUILD").attr("disabled","disabled");
		$("#BTN_ATTACK").attr("disabled","disabled");
		$("#BTN_CREATE_UNIT").attr("disabled","disabled");
		//$("#BTN_AWAIT img").attr('src',$('#BTN_AWAIT img').attr('src').replace('1',''));
		//$("#BTN_BUILD img").attr('src',$('#BTN_BUILD img').attr('src').replace('1',''));
		//$("#BTN_ATTACK img").attr('src',$('#BTN_ATTACK img').attr('src').replace('1',''));
	},
	refreshInfo: function(){
		this.parent.refreshView();
	}
	
});
