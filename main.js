
let ui = new Ui(tela, 10e4);
let editor = new WoltexEditor(ui);
let wenv = editor.getCore().env;

/*
let cor = new WoltexComponent(WoltexXORGateP);
cor.setX(150);
cor.setY(-100);
cor.setDirection(1);
cor.setName("gate");
cor.setHighlight(true);
wenv.addPiece(cor);

let cclk = new WoltexComponent(WoltexClockP);
cclk.setX(0);
cclk.setY(-100);
cclk.setName("clock");
wenv.addPiece(cclk);

let cclk2 = new WoltexComponent(WoltexClockP);
cclk2.setX(0);
cclk2.setY(-200);
cclk2.setName("clock II");
wenv.addPiece(cclk2);

let wire = new WoltexWire();
wire.setPin1(cclk.getPin("OUT"));
wire.setPin2(cor.getPin("IN1"));
wire.setHighlight(true);
wenv.addPiece(wire);

let wire2 = new WoltexWire();
cclk2.getPin("OUT").setHighlight(true);
wire2.setPin1(cclk2.getPin("OUT"));
wire2.setPin2(cor.getPin("IN0"));
wenv.addPiece(wire2);
*/