app.modules.matrix = new trascender({
	properties: {
		name: "matrix", 
		label: "Matrix", 
		icon: "fa-matrix"
	},
	onload: function(){
		this.neo();
	},
	start: function(){
		this.velocidad = parseInt(this.getLS("velocidad",33));
		this.active = (this.getLS("active",'true')=="true")?true:false;
		this.opacity = this.getLS("opacity",0.2);
		if(this.active===true){
			this.move();
			$("#matrix canvas").css("opacity",this.opacity);
		}
	},
	open: function(){
		$("#matrix_modal_form").modal("show");
	},
	move: function(){
		this.interval = setInterval(()=>{this.draw()}, this.velocidad);
	},
	stop: function(){
		clearInterval(this.interval);
	},
	restart: function(){
		this.putLS("velocidad",this.velocidad);
		this.putLS("active",this.active);
		this.putLS("opacity",this.opacity);
		this.stop();
		if(this.active){
			this.move();
		}
		$("#matrix canvas").css("opacity",this.opacity);
	},
	putVelocidad: function(a){
		if(a){
			this.velocidad++;
		}else{
			this.velocidad--;
		}
		this.restart();
	},
	//jc:2020.06.11:14:30:
	//las funciones neo y draw fueron extraidas de la siguiente url: 
	//https://thecodeplayer.com/walkthrough/matrix-rain-animation-html5-canvas-javascript
	neo: function(){
		this.c = document.getElementById("default_matrix_canvas");
		this.ctx = this.c.getContext("2d");
		
		this.c.height = window.innerHeight;
		this.c.width = window.innerWidth;

		//chinese characters - taken from the unicode charset
		this.chinese = "田由甲申甴电甶男甸甹町画甼甽甾甿畀畁畂畃畄畅畆畇畈畉畊畋界畍畎畏畐畑";//

		//converting the string into an array of single characters
		this.chinese = this.chinese.split("");

		this.font_size = 10;
		this.columns = this.c.width/this.font_size; //number of columns for the rain
		//an array of drops - one per column
		this.drops = [];
		//x below is the x coordinate
		//1 = y co-ordinate of the drop(same for every drop initially)
		for(let x = 0; x < this.columns; x++){
			this.drops[x] = 1; 
		}
	},
	draw: function(){
		//drawing the characters
		//Black BG for the canvas
		//translucent BG to show trail
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
		this.ctx.fillRect(0, 0, this.c.width, this.c.height );

		this.ctx.fillStyle = "#0F0"; //green text
		this.ctx.font = this.font_size + "px arial";
		//looping over drops
		for(let i = 0; i < this.drops.length; i++){
			//a random chinese character to print
			var text = this.chinese[Math.floor(Math.random()*this.chinese.length)];
			//x = i*font_size, y = value of drops[i]*font_size
			this.ctx.fillText(text, i*this.font_size, this.drops[i]*this.font_size);
			
			//sending the drop back to the top randomly after it has crossed the screen
			//adding a randomness to the reset to make the drops scattered on the Y axis
			if(this.drops[i]*this.font_size > this.c.height  && Math.random() > 0.975){
				this.drops[i] = 0;				
			}
			
			//incrementing Y coordinate
			this.drops[i]++;
		}
	}
});