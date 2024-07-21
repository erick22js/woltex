const stdout = {};

/*
	Woltex Value
*/
const WMAXSIGNAL = 0xFFFFFFFFFFFFFFFFn;
const WoltexData = {};

function deepClone(data){
	let obj = {};
	if (data instanceof Array){
		obj = new Array();
	}
	else if (data instanceof Object){
		obj = new Object();
	}
	else {
		return data;
	}
	for (let k in data){
		obj[k] = deepClone(data[k]);
	}
	return obj;
}

function getWoltexComponentData(identifier){
	let params = identifier.split('|');
	if (WoltexData[params[0]] instanceof Function){
		let data = WoltexData[params[0]](params[1], params[2]);
		data["identifier"] = identifier;
		return data;
	}
	else if (WoltexData[params[0]]){
		return WoltexData[params[0]];
	}
	return WoltexData["Woltex:Base"]('','');
}

/*
	Woltex Pin Connector
*/
const _WRMATRIX = [[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0]];
function WoltexPin(_iname=""){
	let self = this;
	let wires = []; // Connected wires
	let component = null; // If clear, the owners are the wires
	let spreadout = null; // Output pin to spread signal
	let iname = _iname; // Internal name for single pin (imutable)
	let name = ""; // Identify name, as is showed
	let value = 0n;
	let lvalue = 0n;
	let highlight = false;
	let direction = 0; // Direction of pin
	let x = 0;
	let y = 0;
	
	/*
		Getters/Setters
	*/
	self._putWire = function(wire){
		if (!wires.includes(wire)){
			wires.push(wire);
		}
	}
	self._removeWire = function(wire){
		if (wires.includes(wire)){
			wires.splice(wires.indexOf(wire), 1);
		}
	}
	self._getWires = function(){
		return wires;
	}
	self._setLastValue = function(v){
		lvalue = v;
	}
	self.setComponent = function(comp){
		component = comp;
	}
	self.getComponent = function(){
		return component;
	}
	self.getInternalName = function(){
		return iname;
	}
	self.setName = function(nname){
		name = nname;
	}
	self.getName = function(){
		return name;
	}
	self.setValue = function(val){
		lvalue = value;
		value = BigInt(val);
		if (spreadout){
			spreadout.setValue(value);
		}
	}
	self.getValue = function(){
		return value;
	}
	self.getSpreadout = function(){
		return spreadout;
	}
	self.setSpreadout = function(pin){
		spreadout = pin;
	}
	self.getLastValue = function(){
		return lvalue;
	}
	self.setHighlight = function(mode){
		highlight = mode;
	}
	self.isHighlighted = function(){
		return highlight;
	}
	self.setDirection = function(dir){
		direction = dir;
	}
	self.getDirection = function(){
		return direction;
	}
	self.getAbsDirection = function(){
		return direction + (component? component.getDirection(): 0);
	}
	self.setX = function(nx){
		x = nx;
	}
	self.getX = function(){
		return x;
	}
	self.getAbsX = function(){
		if (component){
			let m = _WRMATRIX[component.getDirection()&3];
			return (x*m[0] + y*m[2]) + component.getX();
		}
		return x;
	}
	self.setY = function(ny){
		y = ny;
	}
	self.getY = function(){
		return y;
	}
	self.getAbsY = function(){
		if (component){
			let m = _WRMATRIX[component.getDirection()&3];
			return (x*m[1] + y*m[3]) + component.getY();
		}
		return y;
	}
	self.reset = function(){
		value = lvalue = 0n;
		if (spreadout){
			spreadout.setValue(0n);
		}
	}
}

/*
	Woltex Circuit Component with custom behavior
*/
function WoltexComponent(data){
	let self = this;
	let env = null;
	let appearance = {};
	let elements = [];
	let pins = {};
	let trigger_pins = {};
	let input_pins = {};
	let output_pins = {};
	let all_pins = [];
	let trgr_pins = [];
	let in_pins = [];
	let out_pins = [];
	let name = "";
	let meta = deepClone(data["meta"]);
	let ticks = 0;
	let highlight = false;
	let direction = 0;
	let x = 0;
	let y = 0;
	
	/*
		General Setup
	*/
	for (let n in data["appearance"]){
		let d = data["appearance"][n];
		let instance = {};
		for (let k in d){
			instance[k] = d[k];
		}
		appearance[n] = instance;
		elements.push(instance);
	}
	for (let tp in data["layout"]["pins"]){
		let pdata = data["layout"]["pins"][tp];
		let pin = new WoltexPin(tp);
		pin.setName(tp);
		pin.setComponent(self);
		pin.setX(pdata[1]);
		pin.setY(pdata[2]);
		pin.setDirection(pdata[3]);
		all_pins.push(pin);
		pins[tp] = pin;
		if (pdata[0]=="T"){
			trigger_pins[tp] = pin;
			trgr_pins.push(pin);
		}
		if (pdata[0]=="I"){
			input_pins[tp] = pin;
			in_pins.push(pin);
		}
		if (pdata[0]=="O"){
			output_pins[tp] = pin;
			out_pins.push(pin);
		}
	}
	if (data["env"]){
		let tenv = woltexDeserialize(data["env"])["selection"]["envs"][0];
		env = tenv;
		let tpins = env._getTriggerPins();
		for (let i=0; i<tpins.length; i++){
			if (pins[tpins[i].getInternalName()])
				pins[tpins[i].getInternalName()].setSpreadout(tpins[i]);
		}
		let ipins = env._getInputPins();
		for (let i=0; i<ipins.length; i++){
			if (pins[ipins[i].getInternalName()])
				pins[ipins[i].getInternalName()].setSpreadout(ipins[i]);
		}
		let opins = env._getOutputPins();
		for (let i=0; i<opins.length; i++){
			if (pins[opins[i].getInternalName()])
				opins[i].setSpreadout(pins[opins[i].getInternalName()]);
		}
	}
	
	/*
		Getters/Setters
	*/
	self._runTicks = function(limit){
		ticks++;
		if (ticks>limit){
			ticks -= limit;
			return true;
		}
		return false;
	}
	self._resetTicks = function(){
		ticks = 0;
	}
	self._setTicks = function(v){
		ticks = v;
	}
	self._getTicks = function(){
		return ticks;
	}
	self._getData = function(){
		return data;
	}
	self._getElements = function(){
		return elements;
	}
	self._getAppearance = function(){
		return appearance;
	}
	self._getLayout = function(){
		return data["layout"];
	}
	self._getCondition = function(){
		return data["condition"]||[];
	}
	self._getInteraction = function(){
		return data["interaction"]||{};
	}
	self._getPins = function(){
		return all_pins;
	}
	self._getTrgrPins = function(){
		return trgr_pins;
	}
	self._getInPins = function(){
		return in_pins;
	}
	self._getOutPins = function(){
		return out_pins;
	}
	self._getMetas = function(){
		return meta;
	}
	self.getEnviorment = function(){
		return env;
	}
	self.setEnviorment = function(nenv){
		env = nenv;
	}
	self.getIdentifier = function(){
		return data["identifier"];
	}
	self.getElement = function(name){
		return appearance[name];
	}
	self.getPin = function(iname){
		return pins[iname];
	}
	self.setName = function(nname){
		name = nname;
	}
	self.getName = function(){
		return name;
	}
	self.setMeta = function(key, value){
		meta[key] = value;
	}
	self.getMeta = function(key){
		return meta[key];
	}
	self.setHighlight = function(mode){
		highlight = mode;
	}
	self.isHighlighted = function(){
		return highlight;
	}
	self.setDirection = function(dir){
		direction = dir;
	}
	self.getDirection = function(){
		return direction;
	}
	self.setX = function(nx){
		x = nx;
	}
	self.getX = function(){
		return x;
	}
	self.setY = function(ny){
		y = ny;
	}
	self.getY = function(){
		return y;
	}
	
	/*
		Behaviors
	*/
	self._process = function(){
		if (env){
			env._update();
		}
		else {
			data.action.call(self, meta, pins);
		}
		return false;
	}
	self.reset = function(){
		ticks = 0;
		if (env){
			env.reset();
		}
		else if (data.reset){
			data.reset.call(self, meta, pins);
		}
		return false;
	}
}

/*
	Woltex Wire to connect components
*/
function WoltexWire(){
	let self = this;
	let pin1 = null;
	let pin2 = null;
	let wide_mask = 1n;
	let wide_size = 1n;
	let highlight = false;
	let loadv = 0n;
	
	/*
		Getters/Setters
	*/
	self._setLoadValue = function(v){
		loadv = v;
	}
	self.setPin1 = function(pin){
		if (pin1){
			pin1._removeWire(self);
		}
		pin1 = pin;
		pin._putWire(self);
	}
	self.getPin1 = function(){
		return pin1;
	}
	self.setPin2 = function(pin){
		if (pin2){
			pin2._removeWire(self);
		}
		pin2 = pin;
		pin._putWire(self);
	}
	self.getPin2 = function(){
		return pin2;
	}
	self.swapPins = function(){ // Swaps direction of wire
		let opin = pin1;
		pin1 = pin2;
		pin2 = opin;
	}
	self.setWide = function(size){
		if (size>=64n){
			wide_mask = 0xFFFFFFFFFFFFFFFFn;
			wide_size = 64n;
		}
		else {
			wide_mask = ((1n<<BigInt(size))-1n)&0xFFFFFFFFFFFFFFFFn;
			wide_size = BigInt(size);
		}
	}
	self.getWideSize = function(){
		return wide_size;
	}
	self.getWideMask = function(){
		return wide_mask;
	}
	self.setHighlight = function(mode){
		highlight = mode;
	}
	self.isHighlighted = function(){
		return highlight;
	}
	self.getLoadValue = function(){
		return loadv;
	}
	
	/*
		Behaviors
	*/
	self._process = function(_beg=null){
		let value = 0n;
		if (pin2==_beg){
			value = pin2.getValue()&wide_mask;
			pin1.setValue(value);
		}
		else {
			value = pin1.getValue()&wide_mask;
			pin2.setValue(value);
		}
		loadv = value;
	}
	self.reset = function(){
		loadv = 0n;
	}
}