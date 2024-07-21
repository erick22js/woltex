
function Ui(canvas, _limit){
	let self = this;
	let ctx = canvas.getContext("2d");
	let width = Number(canvas.width);
	let height = Number(canvas.height);
	
	/*
		Control Properties
	*/
	self.running = true;
	
	/*
		Getters
	*/
	self.getWidth = function(){
		return width;
	}
	self.getHeight = function(){
		return height;
	}
	
	/*
		Drawing Operations
	*/
	self.drawClear = function(color=null){
		if (color){
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, width, height);
		}
		else {
			ctx.clearRect(0, 0, width, height);
		}
	}
	self.drawLine = function(color, x1, y1, x2, y2, lw=1, rounded=true){
		ctx.strokeStyle = color;
		ctx.lineWidth = lw;
		ctx.lineCap = rounded? "round": "square";
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.closePath();
	}
	self.drawHrLine = function(color, x, y, size, lw=1){
		ctx.fillStyle = color;
		ctx.fillRect(x, y-(lw/2), size, lw);
	}
	self.drawVrLine = function(color, x, y, size, lw=1){
		ctx.fillStyle = color;
		ctx.fillRect(x-(lw/2), y, lw, size);
	}
	self.drawVector = function(color, x, y, ang, dis, lw=1, rounded=true){
		ctx.strokeStyle = color;
		ctx.lineWidth = lw;
		ctx.lineCap = rounded? "round": "square";
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + Math.cos(ang)*dis, y + Math.sin(ang)*dis);
		ctx.stroke();
		ctx.closePath();
	}
	self.drawPath = function(color, verts, fill=true, lw=1, close=false){
		if (fill){
			ctx.fillStyle = color;
		}
		else {
			ctx.strokeStyle = color;
			ctx.lineWidth = lw;
		}
		ctx.beginPath();
		ctx.moveTo(verts[0][0], verts[0][1]);
		for (let v=1; v<verts.length; v++){
			ctx.lineTo(verts[v][0], verts[v][1]);
		}
		if (close){
			ctx.lineTo(verts[0][0], verts[0][1]);
		}
		if (fill){
			ctx.fill();
		}
		else {
			ctx.stroke();
		}
		ctx.closePath();
	}
	self.drawRect = function(color, x, y, w, h, fill=true, lw=1){
		if (fill){
			ctx.fillStyle = color;
			ctx.fillRect(x, y, w, h);
		}
		else {
			ctx.strokeStyle = color;
			ctx.lineWidth = lw;
			ctx.strokeRect(x, y, w, h);
		}
	}
	self.drawCircle = function(color, x, y, radius, fill=true, lw=1){
		ctx.fillStyle = ctx.strokeStyle = color;
		ctx.lineWidth = lw;
		ctx.beginPath();
		ctx.moveTo(x+radius, y);
		ctx.arc(x, y, radius, 0, Math.PI*2);
		if (fill){
			ctx.fill();
		}
		else {
			ctx.stroke();
		}
		ctx.closePath();
	}
	self.drawText = function(text, font, color, x, y, fill=true, lw=1){
		ctx.font = font;
		if (fill){
			ctx.fillStyle = color;
			ctx.fillText(text, x, y);
		}
		else {
			ctx.lineWidth = lw;
			ctx.strokeStyle = color;
			ctx.strokeText(text, x, y);
		}
	}
	self.measureText = function(text, font){
		ctx.font = font;
		return ctx.measureText(text).width;
	}
	self.trPush = function(){
		ctx.save();
	}
	self.trSet = function(a, b, c, d, x, y){
		ctx.setTransform(a, b, c, d, x, y);
	}
	self.trTransform = function(a, b, c, d, x, y){
		ctx.transform(a, b, c, d, x, y);
	}
	self.trTranslate = function(x, y){
		ctx.translate(x, y);
	}
	self.trScale = function(x, y){
		ctx.scale(x, y);
	}
	self.trRotate = function(a){
		ctx.rotate(a);
	}
	self.trPop = function(){
		ctx.restore();
	}
	
	/*
		Events
	*/
	self.onStart = function(){};
	self.onUpdate = function(dt){};
	self.onGestDown = function(x, y, id){};
	self.onGestMove = function(x, y, dx, dy, id){};
	self.onGestTap = function(x, y, id){};
	self.onGestHold = function(x, y, id){};
	self.onGestUp = function(x, y, id){};
	
	/*
		Internal Operations
	*/
	let _last_time = 0;
	function _animate(time){
		if (_last_time>=_limit*1000){
			return;
		}
		let dt = (time-_last_time)/1000;
		_last_time = time;
		if (self.running){
			self.onUpdate(dt);
		}
		requestAnimationFrame(_animate);
	}
	
	/*
		External Events
	*/
	let _gests = (function(max){
		let list = [];
		for (let i=0; i<max; i++){
			list.push({
				"x": 0, "y": 0,
				"holding": false,
				"time": (new Date()),
			});
		}
		return list;
	})(8);
	canvas.addEventListener("touchstart", function(ev){
		for (let i=0; i<ev.changedTouches.length; i++){
			let id = ev.changedTouches[i].identifier;
			let x = ev.changedTouches[i].clientX-canvas.getBoundingClientRect().left;
			let y = ev.changedTouches[i].clientY-canvas.getBoundingClientRect().top;
			_gests[id].holding = true;
			_gests[id].x = x;
			_gests[id].y = y;
			_gests[id].time = (new Date());
			self.onGestDown(x, y, id);
		}
	});
	canvas.addEventListener("touchmove", function(ev){
		for (let i=0; i<ev.changedTouches.length; i++){
			let id = ev.changedTouches[i].identifier;
			let x = ev.changedTouches[i].clientX-canvas.getBoundingClientRect().left;
			let y = ev.changedTouches[i].clientY-canvas.getBoundingClientRect().top;
			let dx = x-_gests[id].x;
			let dy = y-_gests[id].y;
			_gests[id].x = x;
			_gests[id].y = y;
			self.onGestMove(x, y, dx, dy, id);
		}
	});
	canvas.addEventListener("touchend", function(ev){
		for (let i=0; i<ev.changedTouches.length; i++){
			let id = ev.changedTouches[i].identifier;
			let x = ev.changedTouches[i].clientX-canvas.getBoundingClientRect().left;
			let y = ev.changedTouches[i].clientY-canvas.getBoundingClientRect().top;
			_gests[id].holding = false;
			_gests[id].x = x;
			_gests[id].y = y;
			let time = (new Date());
			if ((time-_gests[id].time) < 200){
				self.onGestTap(x, y, id);
			}
			else if ((time-_gests[id].time) > 1200){
				self.onGestHold(x, y, id);
			}
			_gests[id].time = (new Date());
			self.onGestUp(x, y, id);
		}
	});
	window.addEventListener("load", function(){
		self.onStart();
		_animate(0);
	});
}