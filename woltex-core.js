
/*
	Woltex Enviorment Application and executor
*/
function WoltexCore(ui){
	let self = this;
	
	/*
		Control Properties
	*/
	self.control = {
		"running": true,
	};
	self.menv = new WoltexEnv(); // Master enviorment
	self.env = self.menv; // Current enviorment
	
	/*
		Getters/Setters
	*/
	
	/*
		Operations
	*/
	
	/*
		Update Functions
	*/
	
	/*
		Control Events
	*/
	self.reset = function(){
		self.env.reset();
	}
	self._update = function(dt){
		// Enviorment Processing
		if (self.control.running){
			self.menv._update(dt);
		}
		
		// Objects rendering
		ui.drawClear();
		
		ui.trPush();
		ui.trTranslate(ui.getWidth()/2, ui.getHeight()/2);
		ui.trScale(self.env.camera.zoom, self.env.camera.zoom);
		ui.trTranslate(-self.env.camera.x, -self.env.camera.y);
		
		let grid_size = self.env.camera.grid_size;
		let offx = Math.floor((self.env.camera.x-(ui.getWidth()/self.env.camera.zoom/2))/grid_size)*grid_size;
		let offy = Math.floor((self.env.camera.y-(ui.getHeight()/self.env.camera.zoom/2))/grid_size)*grid_size;
		let sizx = (ui.getWidth()/self.env.camera.zoom)+grid_size;
		let sizy = (ui.getHeight()/self.env.camera.zoom)+grid_size;
		for (let x = offx; x<(offx+sizx); x+=grid_size){
			ui.drawVrLine("gray", x, offy, sizy, 1/self.env.camera.zoom);
		}
		for (let y = offy; y<(offy+sizy); y+=grid_size){
			ui.drawHrLine("gray", offx, y, sizx, 1/self.env.camera.zoom);
		}
		ui.drawVrLine("black", 0, offy, sizy, 1.5/self.env.camera.zoom);
		ui.drawHrLine("black", offx, 0, sizx, 1.5/self.env.camera.zoom);
		
		// Rendering every wire
		for (let w=0; w<self.env._getWires().length; w++){
			let wire = self.env._getWires()[w];
			let v = wire.getLoadValue()? (63n + (wire.getLoadValue()*192n/wire.getWideMask())): 0n;
			let wide = wire.getWideSize()==1? 3: wire.getWideSize()<17? 5: wire.getWideSize()<33? 6: 7;
			if (wire.isHighlighted()){
				ui.drawLine("yellow", 
					wire.getPin1().getAbsX(),
					wire.getPin1().getAbsY(),
					wire.getPin2().getAbsX(),
					wire.getPin2().getAbsY(),
					wide+8);
			}
			ui.drawLine("rgb("+v+", 0, 0)", 
				wire.getPin1().getAbsX(),
				wire.getPin1().getAbsY(),
				wire.getPin2().getAbsX(),
				wire.getPin2().getAbsY(),
				wide);
		}
		// Rendering every component
		for (let c=0; c<self.env._getComponents().length; c++){
			let comp = self.env._getComponents()[c];
			let layout = comp._getLayout();
			ui.drawRect("black", comp.getX()+layout.left, comp.getY()+layout.top, layout.right-layout.left, layout.bottom-layout.top, false, 0.5);
			
			ui.trPush();
			ui.trTranslate(comp.getX(), comp.getY());
			ui.trRotate(comp.getDirection()*Math.PI/2);
			let elems = comp._getElements();
			for (let i=0; i<elems.length; i++){
				if (elems[i]["points"]){
					if (comp.isHighlighted()){
						ui.drawPath("yellow", elems[i]["points"], false, 8, elems[i]["close"]);
					}
					if (elems[i]["back-color"]){
						ui.drawPath(elems[i]["back-color"], elems[i]["points"], true);
					}
					ui.drawPath("black", elems[i]["points"], false, 3, elems[i]["close"]);
				}
				else if (elems[i]["text"]){
					ui.drawText(elems[i]["text"], "bold "+elems[i]["font-size"]+"px arial", elems[i]["color"], elems[i]["position"][0], elems[i]["position"][1]);
				}
			}
			ui.trPop();
			
			ui.drawText(comp.getName(), "bold 15px arial", "gray",
				comp.getX() + layout.left + (layout.right-layout.left - ui.measureText(comp.getName(), "bold 15px arial"))/2,
				comp.getY() + layout.top + 12 + (layout.bottom-layout.top - 12)/2);
		}
		// Rendering every pin
		for (let p=0; p<self.env._getPins().length; p++){
			let pin = self.env._getPins()[p];
			let v = pin.getValue()? "FF": "00";
			let x = pin.getAbsX();
			let y = pin.getAbsY();
			if (pin.isHighlighted()){
				ui.drawCircle("yellow", x, y, 18);
			}
			ui.drawCircle("black", x, y, 10);
			ui.drawCircle("#"+v+"0000", x, y, 7);
			ui.drawText(pin.getName(), "bold 10px arial", "black", x-10, y+20, false, 4);
			ui.drawText(pin.getName(), "bold 10px arial", "white", x-10, y+20);
			
			let s = Math.sin(pin.getDirection()*Math.PI*0.5), c = Math.cos(pin.getDirection()*Math.PI*0.5);
			// Pin trigger
			if (self.env._getTriggerPins().includes(pin)){
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection())*Math.PI*0.5, 48, 6);
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection()-0.5)*Math.PI*0.5, 14, 6);
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection()+0.5)*Math.PI*0.5, 14, 6);
				ui.drawVector("red", x+c*24, y+s*24, (pin.getDirection()-0.5)*Math.PI*0.5, 14, 6);
				ui.drawVector("red", x+c*24, y+s*24, (pin.getDirection()+0.5)*Math.PI*0.5, 14, 6);
			}
			// Pin input
			else if (self.env._getInputPins().includes(pin)){
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection())*Math.PI*0.5, 48, 6);
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection()-0.5)*Math.PI*0.5, 14, 6);
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection()+0.5)*Math.PI*0.5, 14, 6);
			}
			// Pin output
			else if (self.env._getOutputPins().includes(pin)){
				ui.drawVector("red", x+c*14, y+s*14, (pin.getDirection())*Math.PI*0.5, 48, 6);
				ui.drawVector("red", x+c*62, y+s*62, (pin.getDirection()-1.5)*Math.PI*0.5, 14, 6);
				ui.drawVector("red", x+c*62, y+s*62, (pin.getDirection()+1.5)*Math.PI*0.5, 14, 6);
			}
		}
		
		ui.trPop();
	}
}