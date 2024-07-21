
WoltexData["Woltex:Base"] = function(arg0, arg1){
	return {
		"identifier": "Woltex:Base",
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {},
		},
		/*
			- -null-/trigger (executed only when was hit any trigger)
			- input (execute every tick if any of his inputs changes)
				2#[list of changed inputs] (if null, any input is accepted)
			- time (execute every ammount of time)
				2#time in ticks for update (if null, is executed every tick)
			- meta (execute every tick if his condition is true)
				2#meta name
				3#equal/nequal/lesser/lessequal/greater/greatequal (test condition)
				4#test value
		*/
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){}
	};
};

WoltexData["Woltex:ANDGate"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40], [-40, 40],
					[25, 40], [39, 25],
					[45, 0],
					[39, -25], [25, -40],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"IN0": ["I", -40, -20, 2],
				"IN1": ["I", -40, 20, 2],
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			let in0 = pins["IN0"].getValue();
			let in1 = pins["IN1"].getValue();
			pins["OUT"].setValue(in0&in1);
		}
	};
};

WoltexData["Woltex:ORGate"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-50, -40], [-36, -25],
					[-30, 0],
					[-36, 25], [-50, 40],
					[25, 40], [39, 25],
					[45, 0],
					[39, -25], [25, -40],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"IN0": ["I", -40, -20, 2],
				"IN1": ["I", -40, 20, 2],
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			let in0 = pins["IN0"].getValue();
			let in1 = pins["IN1"].getValue();
			pins["OUT"].setValue(in0|in1);
		}
	};
};

WoltexData["Woltex:NOTGate"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[40, 0],
					[-40, 40],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"IN0": ["I", -40, 0, 2],
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			let in0 = pins["IN0"].getValue();
			pins["OUT"].setValue(in0^WMAXSIGNAL);
		}
	};
};

WoltexData["Woltex:XORGate"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-45, -40], [-31, -25],
					[-25, 0],
					[-31, 25], [-45, 40],
					[25, 40], [39, 25],
					[45, 0],
					[39, -25], [25, -40],
				],
				"close": true,
				"back-color": null,
			},
			"back": {
				"points": [
					[-55, -40], [-41, -25],
					[-35, 0],
					[-41, 25], [-55, 40],
				],
				"close": false,
				"back-color": null,
			}
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"trigger": {},
			"pins": {
				"IN0": ["I", -40, -20, 2],
				"IN1": ["I", -40, 20, 2],
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			let in0 = pins["IN0"].getValue();
			let in1 = pins["IN1"].getValue();
			pins["OUT"].setValue(in0^in1);
		}
	};
};

WoltexData["Woltex:Clock"] = function(time, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"OUT": ["O", 40, 0, 0],
			}
		},
		"condition": ["time", 30/time],
		"meta": { "signal": WMAXSIGNAL },
		"action": function(meta, pins){
			meta["signal"] = meta["signal"]^WMAXSIGNAL;
			pins["OUT"].setValue(meta["signal"]);
		}
	};
};

WoltexData["Woltex:Encoder"] = function(size=1, arg1=null){
	let names = [];
	let pins = {"OUT": ["O", 40, 0, 0]};
	for (let i=0; i<size; i++){names.push("IN"+i); pins["IN"+i]=["I", -40, -(size-1)*20 + i*40, 2];}
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -size*20],
					[-40, size*20],
					[40, size*20],
					[40, -size*20],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -size*20,
			"right": 40,
			"bottom": size*20,
			"pins": pins,
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			let acu = 0n;
			for (let i=0n; i<size; i++){
				acu |= (pins[names[i]].getValue()&1n)<<BigInt(i);
			}
			pins["OUT"].setValue(acu);
		}
	};
};

WoltexData["Woltex:Decoder"] = function(size=1, arg1=null){
	let names = [];
	let pins = {"IN": ["I", -40, 0, 0]};
	for (let i=0; i<size; i++){names.push("OUT"+i); pins["OUT"+i]=["O", 40, -(size-1)*20 + i*40, 2];}
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -size*20],
					[-40, size*20],
					[40, size*20],
					[40, -size*20],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -size*20,
			"right": 40,
			"bottom": size*20,
			"pins": pins,
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			let input = pins["IN"].getValue();
			for (let i=0n; i<size; i++){
				pins[names[i]].setValue((input>>i)&1n);
			}
		}
	};
};

WoltexData["Woltex:Switch"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
			"button": {
				"points": [
					[-25, -25],
					[-25, 25],
					[25, 25],
					[25, -25],
				],
				"close": true,
				"back-color": "#400",
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["meta", "toggle", "equal", true],
		"meta": { "toggle": true, "signal": WMAXSIGNAL },
		"action": function(meta, pins){
			meta["toggle"] = false;
			meta["signal"] = meta["signal"]^WMAXSIGNAL;
			pins["OUT"].setValue(meta["signal"]);
			this.getElement("button")["back-color"] = this.getMeta("signal")? "#F11": "#400";
		},
		"reset": function(meta, pins){
			meta["toggle"] = true;
			meta["signal"] = WMAXSIGNAL;
		},
		"interaction": {
			"ontap": function(x, y){
				this.setMeta("toggle", true);
			},
			"onmove": function(x, y){
				
			},
			"onhold": function(x, y){
				
			},
		},
	};
};

WoltexData["Woltex:Constant"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
			"value": {
				"text": "0x0",
				"color": "black",
				"font-size": 10,
				"position": [-35, -15],
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["time", 1],
		"meta": { "value": 0n },
		"action": function(meta, pins){
			pins["OUT"].setValue(meta["value"]);
		},
		"interaction": {
			"ontap": function(x, y){
				try{
					this.setMeta("value", BigInt(prompt("Change signal value of component:", "0x"+this.getMeta("value").toString(16).toUpperCase()) || this.getMeta("value")));
				}
				catch (e){
					this.setMeta("value", 0n);
				}
				this.getElement("value")["text"] = "0x"+this.getMeta("value").toString(16).toUpperCase();
			},
			"onmove": function(x, y){
				
			},
			"onhold": function(x, y){
				
			},
		},
	};
};

WoltexData["Woltex:Led"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
			"led": {
				"points": [
					[-35, -35],
					[-35, 35],
					[35, 35],
					[35, -35],
				],
				"close": true,
				"back-color": "#000",
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"IN": ["I", -40, 0, 2],
			},
		},
		"condition": ["input"],
		"meta": {},
		"action": function(meta, pins){
			this.getElement("led")["back-color"] = pins["IN"].getValue()? "#FF1": "#000";
		},
	};
};

WoltexData["Woltex:Measurer"] = function(arg0, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
			"value": {
				"text": "0x0",
				"color": "black",
				"font-size": 10,
				"position": [-35, -15],
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"IN": ["I", -40, 0, 0],
			},
		},
		"condition": ["input"],
		"meta": { },
		"action": function(meta, pins){
			this.getElement("value")["text"] = "0x"+pins["IN"].getValue().toString(16).toUpperCase();
		},
		"interaction": {
			"ontap": function(x, y){
				
			},
			"onmove": function(x, y){
				
			},
			"onhold": function(x, y){
				
			},
		},
	};
};

WoltexData["Woltex:Latchable"] = function(size, arg1){
	return {
		"appearance": {
			"base": {
				"points": [
					[-40, -40],
					[-40, 40],
					[40, 40],
					[40, -40],
				],
				"close": true,
				"back-color": null,
			},
		},
		"layout": {
			"left": -40,
			"top": -40,
			"right": 40,
			"bottom": 40,
			"pins": {
				"T": ["T", 0, -40, 3],
				"R/W": ["I", -40, -20, 2],
				"IN": ["I", -40, 20, 2],
				"OUT": ["O", 40, 0, 0],
			},
		},
		"condition": ["trigger"],
		"meta": { "value": 0n },
		"action": function(meta, pins){
			if (!pins["T"].getValue()){
				pins["OUT"].setValue(0n);
			}
			else if (pins["R/W"].getValue()){
				pins["OUT"].setValue(0n);
				meta["value"] = pins["IN"].getValue()&((1n<<BigInt(size))-1n);
			}
			else {
				pins["OUT"].setValue(meta["value"]);
			}
		}
	};
};