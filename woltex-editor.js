
function WoltexEditor(ui){
	let self = this;
	let core = new WoltexCore(ui);
	let workspaces = {"Main": core.env};
	
	let selection = [];
	
	/*
		Getters/Setters
	*/
	self._getWorkspaces = function(){
		return workspaces;
	}
	self.getCore = function(){
		return core;
	}
	
	/*
		Save and Load
	*/
	function save(){
		let ws = [];
		let ws_names = [];
		for (let k in workspaces){
			ws.push(workspaces[k]);
			ws_names.push(k);
		}
		let data = [];
		for (let d in WoltexData){
			if (!d.startsWith("Woltex:") && d!="pin" && d!="wire"){
				data.push([d, d, WoltexData]);
			}
		}
		
		return JSON.stringify({
			"workspaces": woltexSerialize(ws),
			"workspaces_names": ws_names,
			"master": ws.indexOf(core.menv),
			"data": data,
		});
	}
	
	function load(src){
		let data = JSON.parse(src);
		data["workspaces"] = woltexDeserialize(data["workspaces"])["selection"]["envs"];
		wokspaces = {};
		for (let i=0; i<data["workspaces"].length; i++){
			workspaces[data["workspaces_names"][i]] = data["workspaces"][i];
		}
		updateWorkspaceList();
		in_workspace.value = data["workspaces_names"][data["master"]];
		core.menv = core.env = data["workspaces"][data["master"]];
		selection = [];
		
		for (let i=0; i<data["data"].length; i++){
			addComponentOption(data["data"][i][0], data["data"][i][1], data["data"][i][2]);
		}
		
		if (core.control.running){
			btn_execution.click();
		}
	}
	
	/*
		Control Methods
	*/
	function selectPiece(piece, mode="set"/* set, add, sub*/){
		switch (mode){
			case "set": {
				for (let i=0; i<selection.length; i++){
					selection[i].setHighlight(false);
				}
				selection.length = 0;
			}
			break;
			case "add": {}
			break;
			case "sub": {
				if (selection.includes(piece)){
					piece.setHighlight(false);
					selection.splice(selection.indexOf(piece), 1);
				}
				return;
			}
			break;
		}
		if (!selection.includes(piece) && piece){
			selection.push(piece);
			piece.setHighlight(true);
		}
	}
	function getPieceAt(x, y){
		let pins = core.env._getPins();
		for (let i=0; i<pins.length; i++){
			let pin = pins[i];
			if (Math.hypot(x-pin.getAbsX(), y-pin.getAbsY()) < 10){
				return pin;
			}
		}
		let comps = core.env._getComponents();
		for (let i=0; i<comps.length; i++){
			let comp = comps[i];
			let lay = comp._getLayout();
			if (x>=(lay.left+comp.getX()) && x<(lay.right+comp.getX()) &&
				y>=(lay.top+comp.getY()) && y<(lay.bottom+comp.getY())){
				return comp;
			}
		}
		let wires = core.env._getWires();
		for (let i=0; i<wires.length; i++){
			let wire = wires[i];
			if ((Math.hypot(x-wire.getPin1().getAbsX(), y-wire.getPin1().getAbsY())+
				Math.hypot(x-wire.getPin2().getAbsX(), y-wire.getPin2().getAbsY())) <
				(Math.hypot(wire.getPin2().getAbsX()-wire.getPin1().getAbsX(), wire.getPin2().getAbsY()-wire.getPin1().getAbsY())+7)){
				return wire;
			}
		}
		return null;
	}
	function removePin(pin){
		if (pin.getComponent()){
			pin.reset();
			return;
		}
		if (pin._ed_rem) return;
		pin._ed_rem = true;
		let wires = pin._getWires().slice();
		core.env.removePiece(pin);
		for (let i=0; i<wires.length; i++){
			removeWire(wires[i]);
		}
	}
	function removeWire(wire){
		if (wire._ed_rem) return;
		wire._ed_rem = true;
		core.env.removePiece(wire);
		wire.getPin1()._removeWire(wire);
		wire.getPin2()._removeWire(wire);
	}
	function removeComponent(comp){
		if (comp._ed_rem) return;
		comp._ed_rem = true;
		core.env.removePiece(comp);
		let pins = comp._getPins().slice();
		for (let i=0; i<pins.length; i++){
			pins[i].setComponent(null);
			removePin(pins[i]);
		}
	}
	function removePiece(piece){
		if (piece instanceof WoltexPin){
			removePin(piece);
		}
		if (piece instanceof WoltexWire){
			removeWire(piece);
		}
		if (piece instanceof WoltexComponent){
			removeComponent(piece);
		}
	}
	
	/*
		Assign Events
	*/
	ui.onStart = function(){
		core.reset();
	}
	ui.onUpdate = function(dt){
		core.env.camera.grid_size = 16 * (2**(-Math.round(Math.log2(core.env.camera.zoom))));
		core._update(dt);
	}
	let _z_fingers = {
		"fingers": [],
		"pos": [[0, 0], [0, 0]],
		"base": 0,
	};
	let _acu_move = [[0, 0], [0, 0], [0, 0], [0, 0]];
	ui.onGestDown = function(x, y, id){
		if (_z_fingers.fingers.length < 2){
			_z_fingers.pos[_z_fingers.fingers.length][0] = x;
			_z_fingers.pos[_z_fingers.fingers.length][1] = y;
			_z_fingers.fingers.push(id);
			if (_z_fingers.fingers.length == 2){
				_z_fingers.base = Math.hypot(_z_fingers.pos[1][0]-_z_fingers.pos[0][0], _z_fingers.pos[1][1]-_z_fingers.pos[0][1]);
			}
		}
		else {
			_z_fingers.fingers = [];
		}
	}
	ui.onGestUp = function(x, y, id){
		_acu_move[id][0] = 0;
		_acu_move[id][1] = 0;
		if (_z_fingers.fingers.includes(id)){
			_z_fingers.fingers = [];
		}
	}
	ui.onGestMove = function(x, y, dx, dy, id){
		if (_z_fingers.fingers.length == 2){
			_acu_move[id][0] = 0;
			_acu_move[id][1] = 0;
			let idx = _z_fingers.fingers[1]==id;
			_z_fingers.pos[id][0] = x;
			_z_fingers.pos[id][1] = y;
			let obase = _z_fingers.base;
			_z_fingers.base = Math.hypot(_z_fingers.pos[1][0]-_z_fingers.pos[0][0], _z_fingers.pos[1][1]-_z_fingers.pos[0][1]);
			core.env.camera.zoom *= _z_fingers.base/obase;
			stdout.textContent = 2**Math.round(Math.log2(core.env.camera.zoom));
		}
		else {
			if (in_mode_type.value=="drag"||in_mode_type.value=="put"){
				core.env.camera.x -= dx/core.env.camera.zoom;
				core.env.camera.y -= dy/core.env.camera.zoom;
			}
			else if (in_mode_type.value=="interact"){
				core.env.camera.x -= dx/core.env.camera.zoom;
				core.env.camera.y -= dy/core.env.camera.zoom;
			}
			else if (in_mode_type.value=="move"){
				_acu_move[id][0] += dx/core.env.camera.zoom;
				_acu_move[id][1] += dy/core.env.camera.zoom;
				let piece = selection[0];
				for (let i=0; i<selection.length; i++){
					piece = selection[i];
					if ((piece instanceof WoltexComponent) || (piece instanceof WoltexPin && !piece.getComponent())){
						break;
					}
				}
				if ((piece instanceof WoltexComponent) || (piece instanceof WoltexPin && !piece.getComponent())){
					let nx = Math.floor((piece.getX()+_acu_move[id][0])/core.env.camera.grid_size)*core.env.camera.grid_size;
					let ny = Math.floor((piece.getY()+_acu_move[id][1])/core.env.camera.grid_size)*core.env.camera.grid_size;
					if (nx != piece.getX()){
						_acu_move[id][0] -= nx-piece.getX();
						let dif = nx-piece.getX();
						for (let i=0; i<selection.length; i++){
							if ((selection[i] instanceof WoltexComponent) || (selection[i] instanceof WoltexPin && !selection[i].getComponent())) selection[i].setX(selection[i].getX()+dif);
						}
					}
					if (ny != piece.getY()){
						_acu_move[id][1] -= ny-piece.getY();
						let dif = ny-piece.getY();
						for (let i=0; i<selection.length; i++){
							if ((selection[i] instanceof WoltexComponent) || (selection[i] instanceof WoltexPin && !selection[i].getComponent())) selection[i].setY(selection[i].getY()+dif);
						}
					}
				}
			}
		}
	}
	ui.onGestTap = function(x, y, id){
		x = core.env.camera.x + (-ui.getWidth()/2 + x)/core.env.camera.zoom;
		y = core.env.camera.y + (-ui.getHeight()/2 + y)/core.env.camera.zoom;
		if (in_mode_type.value=="put"){
			if (in_comp_type.value=="wire"){
				let pin1 = null
				if (selection.length==0 || !(selection[0] instanceof WoltexPin)){
					selectPiece(getPieceAt(x, y));
				}
				else if ((selection[0] instanceof WoltexPin)){
					pin1 = selection[0];
					selectPiece(getPieceAt(x, y));
				}
				if ((pin1 && selection[0] instanceof WoltexPin) && (selection[0] != pin1)){
					let wire = new WoltexWire();
					wire.setPin1(pin1);
					wire.setPin2(selection[0]);
					wire.setWide(in_edit_mode.value);
					core.env.addPiece(wire);
					selectPiece(null);
				}
			}
			else if (in_comp_type.value=="pin"){
				let pin = null;
				switch (in_edit_mode.value){
					case 'trigger': {
						pin = new WoltexPin(prompt("Insert identifier name for TRIGGER pin:"));
						if (!core.env.checkPinPortAvailable(pin)){
							return;
						}
						core.env.addTriggerPin(pin);
					}
					break;
					case 'input': {
						pin = new WoltexPin(prompt("Insert identifier name for INPUT pin:"));
						if (!core.env.checkPinPortAvailable(pin)){
							return;
						}
						core.env.addInputPin(pin);
					}
					break;
					case 'output': {
						pin = new WoltexPin(prompt("Insert identifier name for OUTPUT pin:"));
						if (!core.env.checkPinPortAvailable(pin)){
							return;
						}
						core.env.addOutputPin(pin);
					}
					break;
					default: {
						pin = new WoltexPin();
					}
				}
				pin.setName(pin.getInternalName());
				x = Math.round(x/core.env.camera.grid_size)*core.env.camera.grid_size;
				y = Math.round(y/core.env.camera.grid_size)*core.env.camera.grid_size;
				pin.setX(x);
				pin.setY(y);
				core.env.addPiece(pin);
			}
			else {
				let comp = new WoltexComponent(getWoltexComponentData(in_comp_type.value+"|"+in_edit_mode.value));
				x = Math.round(x/core.env.camera.grid_size)*core.env.camera.grid_size;
				y = Math.round(y/core.env.camera.grid_size)*core.env.camera.grid_size;
				comp.setX(x);
				comp.setY(y);
				comp.setDirection(0);
				comp.setName(comp.getIdentifier());
				core.env.addPiece(comp);
			}
		}
		else if (in_mode_type.value=="drag"||in_mode_type.value=="move"){
			let piece = getPieceAt(x, y);
			selectPiece(piece, piece? (selection.includes(piece)? "sub": "add"): "set");
		}
		else if (in_mode_type.value=="interact"){
			let piece = getPieceAt(x, y);
			if (piece instanceof WoltexComponent){
				if (piece._getInteraction()["ontap"]){
					piece._getInteraction()["ontap"].call(piece, x+core.env.camera.x-piece.getX(), y+core.env.camera.y-piece.getY());
				}
			}
		}
	}
	
	/*
		Extern Controls
	*/
	function buildChipData(id){
		let env = core.env;
		let pins = {};
		let all_pins = [];
		let sides = [[], [], [], []];
		let tpins = env._getTriggerPins();
		for (let i=0; i<tpins.length; i++){
			sides[tpins[i].getDirection()].push(tpins[i]);
			all_pins.push(tpins[i]);
		}
		let ipins = env._getInputPins();
		for (let i=0; i<ipins.length; i++){
			sides[ipins[i].getDirection()].push(ipins[i]);
			all_pins.push(ipins[i]);
		}
		let opins = env._getOutputPins();
		for (let i=0; i<opins.length; i++){
			sides[opins[i].getDirection()].push(opins[i]);
			all_pins.push(opins[i]);
		}
		sides[0].sort(function(p1, p2){return p1.getY()>p2.getY()});
		sides[1].sort(function(p1, p2){return p1.getX()>p2.getX()});
		sides[2].sort(function(p1, p2){return p1.getY()>p2.getY()});
		sides[3].sort(function(p1, p2){return p1.getX()>p2.getX()});
		let width = (sides[1].length>sides[3].length? sides[1].length: sides[3].length)*80 || 80;
		let height = (sides[0].length>sides[2].length? sides[0].length: sides[2].length)*80 || 80;
		let left = width/-2;
		let right = width/2;
		let top = height/-2;
		let bottom = height/2;
		for (let i=0; i<sides[0].length; i++){
			let pin = sides[0][i];
			pins[pin.getInternalName()] = [
				tpins.includes(pin)? "T": ipins.includes(pin)? "I": "O"
				, right, sides[0].indexOf(pin)*80+40+top, pin.getDirection()];
		}
		for (let i=0; i<sides[1].length; i++){
			let pin = sides[1][i];
			pins[pin.getInternalName()] = [
				tpins.includes(pin)? "T": ipins.includes(pin)? "I": "O"
				, sides[1].indexOf(pin)*80+40+left, bottom, pin.getDirection()];
		}
		for (let i=0; i<sides[2].length; i++){
			let pin = sides[2][i];
			pins[pin.getInternalName()] = [
				tpins.includes(pin)? "T": ipins.includes(pin)? "I": "O"
				, left, sides[2].indexOf(pin)*80+40+top, pin.getDirection()];
		}
		for (let i=0; i<sides[3].length; i++){
			let pin = sides[3][i];
			pins[pin.getInternalName()] = [
				tpins.includes(pin)? "T": ipins.includes(pin)? "I": "O"
				, sides[3].indexOf(pin)*80+40+left, top, pin.getDirection()];
		}
		let data = {
			"identifier": id,
			"env": woltexSerialize([env]),
			"appearance": {
				"base": {
					"points": [
						[left, top],
						[left, bottom],
						[right, bottom],
						[right, top],
					],
					"close": true,
					"back-color": null,
				},
			},
			"layout": {
				"left": left,
				"top": top,
				"right": right,
				"bottom": bottom,
				"pins": pins,
			},
			"condition": ["chip"],
			"meta": {},
		};
		return data;
	}
	function addComponentOption(value, name, data){
		if (WoltexData[value]){
			WoltexData[value] = data;
			return false;
		}
		WoltexData[value] = data;
		
		let opt = document.createElement("option");
		opt.value = value;
		opt.textContent = name;
		in_comp_type.appendChild(opt);
	}
	function removeComponentOption(value){
		let opts = in_comp_type.getElementsByTagName("option");
		for (let i=0; i<opts.length; i++){
			if (opts[i].value==value){
				opts[i].remove();
			}
		}
	}
	function updateWorkspaceList(){
		in_workspace.innerHTML = '';
		for (let n in workspaces){
			in_workspace.innerHTML += '<option value="'+n+'">'+n+'</option>';
		}
	}
	function selectWorkspace(name){
		in_workspace.value = name;
		core.env = core.menv = workspaces[name];
	}
	updateWorkspaceList();
	selectWorkspace("Main");
	in_workspace.onchange = function(){
		selectWorkspace(in_workspace.value);
	}
	btn_createws.onclick = function(){
		let name = prompt("Choose a name for workspace:");
		if (name && (typeof(workspaces[name]) === 'undefined')){
			workspaces[name] = new WoltexEnv();
			updateWorkspaceList();
			selectWorkspace(name);
		}
	}
	btn_removews.onclick = function(){
		delete workspaces[in_workspace.value];
		updateWorkspaceList();
		selectWorkspace(in_workspace.value);
	}
	btn_execution.onclick = function(){
		core.control.running = !core.control.running;
		btn_execution.textContent = core.control.running? "|| Pause": "|> Resume";
	}
	btn_execution.onclick();
	btn_reset.onclick = function(){
		core.env.reset();
	}
	btn_rotclock.onclick = function(){
		for (let i=0; i<selection.length; i++){
			if ((selection[i] instanceof WoltexComponent) || (selection[i] instanceof WoltexPin && !selection[i].getComponent())){
				selection[i].setDirection((selection[i].getDirection()+1)&3);
			}
		}
	}
	btn_rotanti.onclick = function(){
		for (let i=0; i<selection.length; i++){
			if ((selection[i] instanceof WoltexComponent) || (selection[i] instanceof WoltexPin && !selection[i].getComponent())){
				selection[i].setDirection((selection[i].getDirection()-1)&3);
			}
		}
	}
	btn_delete.onclick = function(){
		for (let i=0; i<selection.length; i++){
			removePiece(selection[i]);
		}
		selectPiece(null);
	}
	btn_detail.onclick = function(){
		if (selection.length != 1){
			alert("Must select a single wire/pin/component");
			return;
		}
		let pie = selection[0]
		if (pie instanceof WoltexPin){
			alert(
				"Woltex PIN\n"+
				"name: "+pie.getName()+"\n"+
				(pie.getComponent()? "owner: "+pie.getComponent().getName()+"\n": "")+
				"value: "+pie.getValue()
			);
		}
		if (pie instanceof WoltexWire){
			alert(
				"Woltex WIRE\n"+
				"load value: "+pie.getLoadValue()
			);
		}
		if (pie instanceof WoltexComponent){
			alert(
				"Woltex COMPONENT\n"+
				"name: "+pie.getName()+"\n"+
				"identifier: "+pie.getIdentifier()
			);
		}
	}
	btn_clone.onclick = function(){
		let data = woltexDeserialize(woltexSerialize(selection));
		selectPiece(null);
		for (let i=0; i<data.selection.pieces.length; i++){
			let item = data.selection.pieces[i];
			if ((item instanceof WoltexComponent) || (item instanceof WoltexPin && !item.getComponent())){
				item.setX(item.getX()+64);
				item.setY(item.getY()+64);
			}
			core.env.addPiece(item);
			selectPiece(item, "add");
		}
	}
	btn_serialize.onclick = function(){
		let serial = woltexSerialize(selection);
		//deserialize(serial);
		alert(serial);
	}
	btn_enter.onclick = function(){
		if (selection.length==1 && (selection[0] instanceof WoltexComponent) && selection[0].getEnviorment()){
			core.env.selection = selection;
			core.env = selection[0].getEnviorment();
			selection = core.env.selection || [];
			//selectPiece(null, "set");
		}
		else {
			alert("You must pick a single component with a built-in chip.");
		}
	}
	btn_leave.onclick = function(){
		if (core.env.getParentEnviorment()){
			core.env.selection = selection;
			core.env = core.env.getParentEnviorment();
			selection = core.env.selection || [];
			//selectPiece(null, "set");
		}
		else {
			alert("cannot leave main board");
		}
	}
	btn_build.onclick = function(){
		let name = in_workspace.value;
		let id = 'Chip:'+name.replace(/[^a-zA-Z0-9\-\_]/g, '');
		addComponentOption(id, name, buildChipData(id));
		alert("Chip with name '"+name+"' has been build!");
	}
	btn_rem_comp.onclick = function(){
		if (!confirm("Do you want to remove the component with name '"+in_comp_type.options[in_comp_type.selectedIndex].textContent+"'?")){
			return;
		}
		removeComponentOption(in_comp_type.value);
	}
	in_comp_type.onchange = function(){
		if (['wire', 'Woltex:Encoder', 'Woltex:Decoder', 'Woltex:Latchable'].includes(in_comp_type.value)){
			lbl_edit_mode.hidden = null;
			lbl_edit_mode.textContent = 'Size:';
			in_edit_mode.hidden = null;
			in_edit_mode.innerHTML = "";
			for (let i=1; i<=64; i++) in_edit_mode.innerHTML += '<option value="'+i+'">'+i+' bit'+(i>1? 's': '')+'</option>';
			in_edit_mode.value = 1;
		}
		else if (in_comp_type.value=='Woltex:Clock'){
			lbl_edit_mode.hidden = null;
			lbl_edit_mode.textContent = 'Time:';
			in_edit_mode.hidden = null;
			in_edit_mode.innerHTML = '<option value="1">1Hz</option><option value="5">5Hz</option><option value="15">15Hz</option><option value="30">30Hz</option>';
			in_edit_mode.value = 1;
		}
		else if (in_comp_type.value=='pin'){
			lbl_edit_mode.hidden = null;
			lbl_edit_mode.textContent = 'Mode:';
			in_edit_mode.hidden = null;
			in_edit_mode.innerHTML = '<option value="default">Default</option><option value="trigger">Trigger</option><option value="input">Input</option><option value="output">Output</option>';
			in_edit_mode.value = 'default';
		}
		else {
			lbl_edit_mode.hidden = true;
			in_edit_mode.hidden = true;
		}
	}
	in_comp_type.onchange();
	btn_load.onclick = function(){
		let src = prompt("Paste save source here:");
		if (src){
			load(src);
		}
	}
	btn_save.onclick = function(){
		prompt("Copy save source from here:", save());
		//alert(save());
	}
}