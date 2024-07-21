
/*
	Woltex Simulation Enviorment
*/
function WoltexEnv(){
	let self = this;
	let penv = null; // Parent Enviorment
	let comps = [];
	let comps_event = []; // List of eventual triggerable components
	let comps_trigger = []; // List of triggered components in current tick
	let wires = [];
	let pins = [];
	let in_pins = []; // Input pins (for input execution)
	let trg_pins = []; // Trigger pins (for trigger execution)
	let out_pins = []; // Output pins (for execution termination)
	
	/*
		Control Properties
	*/
	self.camera = {
		"x": 0, "y": 0,
		"zoom": 1,
		"grid_size": 1,
	};
	
	/*
		Internal
	*/
	self.checkPinPortAvailable = function(iname){
		for (let i=0; i<trg_pins.length; i++){
			if (trg_pins[i].getInternalName()==iname){
				return false;
			}
		}
		for (let i=0; i<in_pins.length; i++){
			if (in_pins[i].getInternalName()==iname){
				return false;
			}
		}
		for (let i=0; i<out_pins.length; i++){
			if (out_pins[i].getInternalName()==iname){
				return false;
			}
		}
		return true;
	}
	
	/*
		Getters/Setters
	*/
	self._getPins = function(){
		return pins;
	}
	self._getWires = function(){
		return wires;
	}
	self._getComponents = function(){
		return comps;
	}
	self._getInputPins = function(){
		return in_pins;
	}
	self._getTriggerPins = function(){
		return trg_pins;
	}
	self._getOutputPins = function(){
		return out_pins;
	}
	self.getParentEnviorment = function(){
		return penv;
	}
	self.setParentEnviorment = function(env){
		penv = env;
	}
	self.addTriggerPin = function(pin){
		let iname = pin.getInternalName();
		if (self.checkPinPortAvailable(iname) && !trg_pins.includes(pin)){
			trg_pins.push(pin);
		}
	}
	self.addInputPin = function(pin){
		let iname = pin.getInternalName();
		if (self.checkPinPortAvailable(iname) && !in_pins.includes(pin)){
			in_pins.push(pin);
		}
	}
	self.addOutputPin = function(pin){
		let iname = pin.getInternalName();
		if (self.checkPinPortAvailable(iname) && !out_pins.includes(pin)){
			out_pins.push(pin);
		}
	}
	
	/*
		Operations
	*/
	self.addPiece = function(piece){
		if (piece instanceof WoltexPin){
			if (!pins.includes(piece)){
				pins.push(piece);
			}
		}
		else if (piece instanceof WoltexWire){
			if (!wires.includes(piece)){
				wires.push(piece);
				self.addPiece(piece.getPin1());
				self.addPiece(piece.getPin2());
			}
		}
		else if (piece instanceof WoltexComponent){
			if (!comps.includes(piece)){
				comps.push(piece);
				let pins = piece._getPins();
				for (let p=0; p<pins.length; p++){
					self.addPiece(pins[p]);
				}
				if (piece._getCondition()[0]=="time" || piece._getCondition()[0]=="meta" || piece._getCondition()[0]=="chip"){
					comps_event.push(piece);
				}
				if (piece.getEnviorment()){
					piece.getEnviorment().setParentEnviorment(self);
				}
			}
		}
	}
	self.removePiece = function(piece){
		if (piece instanceof WoltexPin){
			if (pins.includes(piece)){
				pins.splice(pins.indexOf(piece), 1);
			}
			if (trg_pins.includes(piece)){
				trg_pins.splice(trg_pins.indexOf(piece), 1);
			}
			if (in_pins.includes(piece)){
				in_pins.splice(in_pins.indexOf(piece), 1);
			}
			if (out_pins.includes(piece)){
				out_pins.splice(out_pins.indexOf(piece), 1);
			}
		}
		else if (piece instanceof WoltexWire){
			if (wires.includes(piece)){
				wires.splice(wires.indexOf(piece), 1);
			}
		}
		else if (piece instanceof WoltexComponent){
			if (comps.includes(piece)){
				comps.splice(comps.indexOf(piece), 1);
			}
			if (comps_event.includes(piece)){
				comps_event.splice(comps_event.indexOf(piece), 1);
			}
		}
	}
	
	/*
		Update Functions
	*/
	let stage = 0;
	function updateComponent(comp, start=false){
		if (comp._stage == stage){
			return;
		}
		switch (comp._getCondition()[0]){
			case null:
			case "trigger": {
				if (start){
					comp._process();
				}
				else {
					let tpins = comp._getTrgrPins();
					let activate = false;
					for (let i=0; i<tpins.length; i++){
						if ((!tpins[i].getValue())!=(!tpins[i].getLastValue())){
							activate = true;
							tpins[i]._setLastValue(tpins[i].getValue());
						}
					}
					if (activate){
						if (!comps_trigger.includes(comp)){
							comps_trigger.push(comp);
						}
					}
					return;
				}
			}
			break;
			case "meta": {
				let cond = false;
				switch (comp._getCondition()[2]){
					case "equal": cond = (comp.getMeta(comp._getCondition()[1])==comp._getCondition()[3]); break;
					case "nequal": cond = (comp.getMeta(comp._getCondition()[1])!=comp._getCondition()[3]); break;
					case "lesser": cond = (comp.getMeta(comp._getCondition()[1])<comp._getCondition()[3]); break;
					case "lessequal": cond = (comp.getMeta(comp._getCondition()[1])<=comp._getCondition()[3]); break;
					case "greater": cond = (comp.getMeta(comp._getCondition()[1])>comp._getCondition()[3]); break;
					case "greatequal": cond = (comp.getMeta(comp._getCondition()[1])>=comp._getCondition()[3]); break;
				}
				if (start){
					if (cond){
						comp._process();
					}
				}
				else {
					return;
				}
			}
			break;
			case "time": {
				if (start){
					if (comp._runTicks(comp._getCondition()[1]||0)){
						comp._process();
					}
				}
				else {
					return;
				}
			}
			break;
			case "input": {
				comp._process();
			}
			break;
			case "chip": {
				comp._process();
			}
			break;
		}
		comp._stage = stage;
		let out_pins = comp._getOutPins();
		for (let i=0; i<out_pins.length; i++){
			updatePin(out_pins[i]);
		}
	}
	function updatePin(pin){
		let wires = pin._getWires();
		for (let i=0; i<wires.length; i++){
			updateWire(wires[i], pin);
		}
		let comp = pin.getComponent();
		if (comp && !comp._getOutPins().includes(pin)){
			updateComponent(comp);
		}
	}
	function updateWire(wire, pin_in){
		if (wire._stage == stage){
			return;
		}
		wire._stage = stage;
		wire._process(pin_in);
		if (wire.getPin1()==pin_in){
			updatePin(wire.getPin2());
		}
		else {
			updatePin(wire.getPin1());		
		}
	}
	
	/*
		Control Events
	*/
	self.reset = function(){
		// Reset every wire
		for (let w=0; w<wires.length; w++){
			let wire = wires[w];
			wire.reset();
		}
		// Reset every component
		for (let c=0; c<comps.length; c++){
			let comp = comps[c];
			comp.reset();
		}
		// Reset every pin
		for (let p=0; p<pins.length; p++){
			let pin = pins[p];
			pin.reset();
		}
	}
	self._update = function(dt){
		// Pieces Processing
		stage = (stage&0xFFFF)+1;
		for (let i=0; i<in_pins.length; i++){
			updatePin(in_pins[i]);
		}
		for (let i=0; i<comps_event.length; i++){
			updateComponent(comps_event[i], true);
		}
		for (let i=0; i<trg_pins.length; i++){
			if ((!trg_pins[i].getLastValue())!=(!trg_pins[i].getValue())){
				updatePin(trg_pins[i]);
				trg_pins[i]._setLastValue(trg_pins[i].getValue());
			}
		}
		for (let i=0; i<comps_trigger.length; i++){
			updateComponent(comps_trigger[i], true);
		}
		comps_trigger.length = 0;
	}
}