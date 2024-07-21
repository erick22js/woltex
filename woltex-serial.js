

function woltexSerialize(selection){
	let sdata = {
		"pieces": [], "_pieces": [],
		"envs": [], "_envs": [],
		"data": {},
		"selection": {
			"pieces": [],
			"envs": [],
		},
	};
	
	/*
		Expands every piece, enviorments or data to global
	*/
	function expand(list, outer=null){
		for (let i=0; i<list.length; i++){
			if (list[i] instanceof WoltexEnv){
				let env = list[i];
				if (env && !sdata["_envs"].includes(env)){
					sdata["_envs"].push(env);
					let slist = env._getComponents().slice().concat(env._getWires(), env._getPins());
					expand(slist);
					if (outer) outer.push(env);
				}
				continue;
			}
			if (sdata["_pieces"].includes(list[i])){
				continue;
			}
			sdata["_pieces"].push(list[i]);
			if (outer) outer.push(list[i]);
			if (list[i] instanceof WoltexPin){
				//
			}
			if (list[i] instanceof WoltexWire){
				if (!sdata["_pieces"].includes(list[i].getPin1())){
					sdata["_pieces"].push(list[i].getPin1());
					if (outer) outer.push(list[i].getPin1());
				}
				if (!sdata["_pieces"].includes(list[i].getPin2()))
					sdata["_pieces"].push(list[i].getPin2());
					if (outer) outer.push(list[i].getPin2());
			}
			if (list[i] instanceof WoltexComponent){
				let pins = list[i]._getPins();
				for (let p=0; p<pins.length; p++){
					if (!sdata["_pieces"].includes(pins[p])){
						sdata["_pieces"].push(pins[p]);
						if (outer) outer.push(pins[p]);
					}
				}
				
				let env = list[i].getEnviorment();
				if (env && !sdata["_envs"].includes(env)){
					sdata["data"][list[i].getIdentifier()] = list[i]._getData();
					expand([env], outer);
				}
			}
		}
	}
	let allselection = [];
	expand(selection, allselection);
	
	/*
		Catalogs every related object
	*/
	for (let p=0; p<sdata["_pieces"].length; p++){
		let piece = sdata["_pieces"][p];
		if (piece instanceof WoltexPin){
			sdata["pieces"][p] = {
				"type": "P",
				"iname": piece.getInternalName(),
				"name": piece.getName(),
				"component": sdata["_pieces"].includes(piece.getComponent())? sdata["_pieces"].indexOf(piece.getComponent()): -1,
				"spreadout": sdata["_pieces"].includes(piece.getSpreadout())? sdata["_pieces"].indexOf(piece.getSpreadout()): -1,
				"lvalue": piece.getLastValue(),
				"value": piece.getValue(),
				"direction": piece.getDirection(),
				"x": piece.getX() + (!sdata["_pieces"].includes(piece.getComponent()) && piece.getComponent()? piece.getComponent().getX(): 0),
				"y": piece.getY() + (!sdata["_pieces"].includes(piece.getComponent()) && piece.getComponent()? piece.getComponent().getY(): 0),
			};
		}
		if (piece instanceof WoltexWire){
			sdata["pieces"][p] = {
				"type": "W",
				"pin1": sdata["_pieces"].indexOf(piece.getPin1()),
				"pin2": sdata["_pieces"].indexOf(piece.getPin2()),
				"loadv": piece.getLoadValue(),
				"wide": piece.getWideSize(),
			};
		}
		if (piece instanceof WoltexComponent){
			let oappes = piece._getAppearance();
			let appes = {};
			for (let a in oappes){
				let oappe = oappes[a];
				let appe = {};
				for (let k in oappe){
					let v = oappe[k];
					if (!(v instanceof Object)){
						appe[k] = v;
					}
				}
				appes[a] = appe;
			}
			let env = piece.getEnviorment();
			let data = piece._getData();
			sdata["pieces"][p] = {
				"type": "C",
				"name": piece.getName(),
				"identifier": piece.getIdentifier(),
				"data": env? true: false,
				"enviorment": sdata["_envs"].includes(env)? sdata["_envs"].indexOf(env): -1,
				"appearance": appes,
				"meta": piece._getMetas(),
				"ticks": piece._getTicks(),
				"direction": piece.getDirection(),
				"x": piece.getX(),
				"y": piece.getY(),
			};
		}
	}
	for (let e=0; e<sdata["_envs"].length; e++){
		let env = sdata["_envs"][e];
		let pieces = env._getComponents().slice().concat(env._getWires(), env._getPins());
		for (let i=0; i<pieces.length; i++){
			pieces[i] = sdata["_pieces"].indexOf(pieces[i]);
		}
		let tgpins = env._getTriggerPins().slice();
		for (let i=0; i<tgpins.length; i++){
			tgpins[i] = sdata["_pieces"].indexOf(tgpins[i]);
		}
		let inpins = env._getInputPins().slice();
		for (let i=0; i<inpins.length; i++){
			inpins[i] = sdata["_pieces"].indexOf(inpins[i]);
		}
		let outpins = env._getOutputPins().slice();
		for (let i=0; i<outpins.length; i++){
			outpins[i] = sdata["_pieces"].indexOf(outpins[i]);
		}
		sdata["envs"][e] = {
			"pieces": pieces,
			"trg_pins": tgpins,
			"in_pins": inpins,
			"out_pins": outpins,
			"camera": env.camera,
		};
	}
	
	/*
		Polishing some data and returning complete serialization
	*/
	for (let i=0; i<allselection.length; i++){
		if (allselection[i] instanceof WoltexEnv){
			sdata["selection"]["envs"].push(sdata["_envs"].indexOf(allselection[i]));
		}
		else {
			sdata["selection"]["pieces"].push(sdata["_pieces"].indexOf(allselection[i]));
		}
	}
	delete sdata["_pieces"];
	delete sdata["_envs"];
	return JSON.stringify(sdata, function(k, v){
			if ((v instanceof Array) || (v instanceof Object && v.constructor==Object)){
				return v;
			}
			let type = "o:";
			switch (typeof(v)){
				case 'boolean': type = "b:"; break;
				case 'number': type = "n:"; break;
				case 'bigint': type = "l:"; break;
				case 'string': type = "s:"; break;
			}
			if (typeof(v)==='undefined' || v==null) return 'null';
			return type+v.toString();
		});
}

function woltexDeserialize(serial){
	let sdata = JSON.parse(serial, function(k, v, ctx){
		if ((v instanceof Array) || (v instanceof Object && v.constructor==Object)){
			return v;
		}
		if (v.length==0 || v=='null'){
			return null;
		}
		if (v.substr(0, 2) == 'b:'){
			v = v.substr(2);
			return v=='true'||v=='True'||v=='1';
		}
		if (v.substr(0, 2) == 'n:'){
			return Number(v.substr(2));
		}
		if (v.substr(0, 2) == 'l:'){
			return BigInt(v.substr(2));
		}
		if (v.substr(0, 2) == 's:'){
			return v.substr(2);
		}
		return null;
	});
	
	/*
		Pre-generating every single object
	*/
	sdata["_pieces"] = [];
	sdata["_envs"] = [];
	for (let i=0; i<sdata["pieces"].length; i++){
		if (sdata["pieces"][i]["type"]=="P"){
			sdata["_pieces"][i] = new WoltexPin(sdata["pieces"][i]["iname"]);
		}
		if (sdata["pieces"][i]["type"]=="W"){
			sdata["_pieces"][i] = new WoltexWire();
		}
		if (sdata["pieces"][i]["type"]=="C"){
			let data = sdata["pieces"][i]["data"]? sdata["data"][sdata["pieces"][i]["identifier"]]: getWoltexComponentData(sdata["pieces"][i]["identifier"]);
			sdata["_pieces"][i] = new WoltexComponent(data);
		}
	}
	for (let i=0; i<sdata["envs"].length; i++){
		sdata["_envs"][i] = new WoltexEnv();
	}
	
	/*
		Evaluating every object property
	*/
	// Decode components
	for (let i=0; i<sdata["pieces"].length; i++){
		if (sdata["pieces"][i]["type"]=="C"){
			let item = sdata["pieces"][i];
			let comp = sdata["_pieces"][i];
			comp.setName(item["name"]);
			for (let e in item["appearance"]){
				for (let k in item["appearance"][e]){
					comp.getElement(e)[k] = item["appearance"][e][k];
				}
			}
			for (let m in item["meta"]){
				comp.setMeta(m, item["meta"][m]);
			}
			comp._setTicks(item["ticks"]);
			if (item["env"]>=0){
				comp.setEnviorment(sdata["envs"][item["env"]]);
			}
			comp.setDirection(item["direction"]);
			comp.setX(item["x"]);
			comp.setY(item["y"]);
			sdata["pieces"][i] = comp;
		}
	}
	// Decode pins
	for (let i=0; i<sdata["pieces"].length; i++){
		if (sdata["pieces"][i]["type"]=="P"){
			let item = sdata["pieces"][i];
			let pin = sdata["_pieces"][i];
			if (item["component"]>=0){
				pin = sdata["_pieces"][item["component"]].getPin(item["iname"]);
				sdata["_pieces"][i] = pin;
			}
			else {
				pin.setName(item["name"]);
			}
			pin._setLastValue(item["lvalue"]);
			pin.setSpreadout(item["spreadout"]>=0? sdata["_pieces"][item["spreadout"]]: null);
			pin.setValue(item["value"]);
			pin.setDirection(item["direction"]);
			pin.setX(item["x"]);
			pin.setY(item["y"]);
			sdata["pieces"][i] = pin;
		}
	}
	// Decode wires
	for (let i=0; i<sdata["pieces"].length; i++){
		if (sdata["pieces"][i]["type"]=="W"){
			let item = sdata["pieces"][i];
			let wire = sdata["_pieces"][i];
			wire.setPin1(sdata["_pieces"][item["pin1"]]);
			wire.setPin2(sdata["_pieces"][item["pin2"]]);
			wire._setLoadValue(item["loadv"]);
			wire.setWide(item["wide"]);
			sdata["pieces"][i] = wire;
		}
	}
	// Final insertions at enviorments
	for (let i=0; i<sdata["envs"].length; i++){
		let item = sdata["envs"][i];
		let env = sdata["_envs"][i];
		env.camera = item["camera"];
		for (let p=0; p<item["pieces"].length; p++){
			env.addPiece(sdata["_pieces"][item["pieces"][p]]);
		}
		for (let p=0; p<item["trg_pins"].length; p++){
			env.addTriggerPin(sdata["_pieces"][item["trg_pins"][p]]);
		}
		for (let p=0; p<item["in_pins"].length; p++){
			env.addInputPin(sdata["_pieces"][item["in_pins"][p]]);
		}
		for (let p=0; p<item["out_pins"].length; p++){
			env.addOutputPin(sdata["_pieces"][item["out_pins"][p]]);
		}
		sdata["envs"][i] = env;
	}
	
	/*
		Exporting selection
	*/
	delete sdata["_pieces"];
	delete sdata["_envs"];
	for (let i=0; i<sdata["selection"]["pieces"].length; i++){
		sdata["selection"]["pieces"][i] = sdata["pieces"][sdata["selection"]["pieces"][i]];
	}
	for (let i=0; i<sdata["selection"]["envs"].length; i++){
		sdata["selection"]["envs"][i] = sdata["envs"][sdata["selection"]["envs"][i]];
	}
	return sdata;
}
