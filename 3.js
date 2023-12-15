var canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
window.addEventListener("resize", function() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
canvas.addEventListener('contextmenu', event => event.preventDefault());

var mouse = {
	x: canvas.width / 2,
	y: canvas.height / 2,
	l: false,
	m: false,
	r: false
};

canvas.addEventListener("mousemove", function(event) {
	mouse.x = event.x;
	mouse.y = event.y;
});
canvas.addEventListener("mousedown", function(event) {
	switch (event.button) {
		case 0:
			mouse.l = true;
			break;
		case 1:
			mouse.m = true;
			break;
		case 2:
			mouse.r = true;
			break;
	}
});
canvas.addEventListener("mouseup", function(event) {
	switch (event.button) {
		case 0:
			mouse.l = false;
			break;
		case 1:
			mouse.m = false;
			break;
		case 2:
			mouse.r = false;
			break;
	}
});
canvas.addEventListener("wheel", function(event) {
	if (scrn.lookEnabled && scrn.moveStyle === "cam") {
		scrn.dist *= 1 + event.deltaY / 1000;
	}
});
window.addEventListener("keydown", function(event) {
	keys[event.which || event.keyCode] = true;
	switch (event.keyCode) {
		case 80: // P key, pause
			pause = !pause;
			break;
		case 84: // T key, toggle camera mode
			if (scrn.moveStyle === "cam") scrn.moveStyle = "free";
			else scrn.moveStyle = "cam";
			break;
		case 188: // < (comma), slower run speed
			if (event.shiftKey) activeSystem.speed /= 2;
			else {
				activeSystem.calcs /= 2;
				if (activeSystem.calcs < 1) activeSystem.calcs = 1;
			}
			break;
		case 190: // > (period), faster run speed
			if (event.shiftKey) activeSystem.speed *= 2;
			else {
				activeSystem.calcs *= 2;
				if (activeSystem.calcs > 2 ** 10) activeSystem.calcs = 2 ** 10;
			}
			break;
		case 219: // left bracket, scroll focus
			scrn.focus--;
			if (scrn.focus < 0) scrn.focus += activeSystem.b.length;
			break;
		case 221: // right bracket, scroll focus
			scrn.focus++;
			if (scrn.focus >= activeSystem.b.length) scrn.focus -= activeSystem.b.length;
			break;
	}
});
window.addEventListener("keyup", function(event) {
	keys[event.which || event.keyCode] = false;
});
var keys = [];
for (var x = 0; x < 256; x++) { keys[x] = false; }


function V(x=0, y=0, z=0) {
	if (x instanceof V) {
		this.x = x.x;
		this.y = x.y;
		this.z = x.z;
	} else {
		this.x = x;
		this.y = y;
		this.z = z;
	}
};
V.prototype.abs = function() { return Math.sqrt(this.abs2()); };
V.prototype.abs2 = function() { return this.dot(this); };
V.prototype.add = function(v) { return new V(this.x + v.x, this.y + v.y, this.z + v.z); };
V.prototype.sub = function(v) { return new V(this.x - v.x, this.y - v.y, this.z - v.z); };
V.prototype.mult = function(s) { return new V(this.x * s, this.y * s, this.z * s); };
V.prototype.dot = function(v) { return this.x * v.x + this.y * v.y + this.z * v.z; };
V.prototype.cross = function(v) { return new V(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); };
V.prototype.angle = function(v) { return Math.acos(this.dot(v) / (this.abs() * v.abs())); };
V.prototype.normalize = function() { return new V(this.mult(1 / this.abs())); };

V.prototype.rotate = function(axis, angle) {
	var q = new Q(Math.cos(angle / 2), Math.sin(angle / 2) * axis.x, Math.sin(angle / 2) * axis.y, Math.sin(angle / 2) * axis.z);
	var p = new Q(0, this.x, this.y, this.z);
	var p2 = q.mult(p).mult(new Q(q.w, -q.x, -q.y, -q.z));
	return new V(p2.x, p2.y, p2.z);
};

/*
V.prototype.localize = function(p, f, dx=0) {
	if (f.abs2() === 0) return this.sub(p);
	else f = f.normalize();
	dx = dx;

	var v = this.sub(p);

	var temp = Math.sqrt(1 - f.y*f.y);
	if (Math.abs(f.y) === 1) var v1 = new V(v.x * Math.cos(dx) - v.z * Math.sin(dx), v.y, v.z * Math.cos(dx) + v.x * Math.sin(dx));
	else var v1 = new V(v.x * f.z/temp - v.z * f.x/temp, v.y, v.z * f.z/temp + v.x * f.x/temp);

	var v2 = new V(v1.x, v1.y * temp + v1.z * f.y, v1.z * temp - v1.y * f.y);

	return v2;

};

V.prototype.globalize = function(p, f) {
	if (f.abs2() === 0) return this.add(p);
	else f = f.normalize();

	var v2 = new V(this);
	var temp = Math.sqrt(1 - f.y*f.y);
	var v1 = new V(v2.x, v2.y * temp - v2.z * f.y, v2.z * temp + v2.y * f.y);
	var v = new V(v1.x * f.z/temp + v1.z * f.x/temp, v1.y, v1.z * f.z/temp - v1.x * f.x/temp);

	return v.add(p);
};
*/


function Q(w=1, x=0, y=0, z=0) {
	if (w instanceof V) {
		this.w = w.w;
		this.x = w.x;
		this.y = w.y;
		this.z = w.z;
	} else {
		this.w = w;
		this.x = x;
		this.y = y;
		this.z = z;
	}
};

Q.prototype.mult = function(q) {
	return new Q(
		this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
		this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
		this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
		this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
	);
};
Q.prototype.n = function() { var m = Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z); this.w /= m; this.x /= m; this.y /= m; this.z /= m; };

function lerp(min, max, t) { return t * (max - min) + min; };
function prel(min, max, v) { return (v - min) / (max - min); };





var scrn = {
	lookEnabled: true,
	moveStyle: "cam",
	focus: new V(),
	lookSpeed: Math.PI / 360,
	moveSpeed: 500000,
	p: new V(),
	dx: 0,
	dy: 0,
	fov: 80,
	dist: 36000000,
	f: function() { return new V(Math.sin(scrn.dx) * Math.cos(scrn.dy), -Math.sin(scrn.dy), Math.cos(scrn.dx) * Math.cos(scrn.dy)); },
	project: function(v) {
		var moveToPold = false;
		var skipLine = false;
		Pold = P;

		var pr = v.sub(scrn.p).rotate(new V(0, -1, 0), -scrn.dx).rotate(new V(1, 0, 0), -scrn.dy);

		var lx = 0, ly = 0;
		if (pr.z > 0) {
			// new point in
			lx = pr.x / (pr.z * Math.tan(scrn.fov * Math.PI / 360));
			ly = pr.y / (pr.z * Math.tan(scrn.fov * Math.PI / 360));

			if (!Pold.in) {
				// out - in, new point normal, old point change to camp plane crossing point
				moveToPold = true;
				var t = prel(Pold.p.z, pr.z, 0);
				var lx1 = lerp(Pold.p.x, pr.x, t);
				var ly1 = lerp(Pold.p.y, pr.y, t);
				var s = Math.max(Math.abs(lx1), Math.abs(ly1)) / 3;
				lx1 -= lx; lx1 /= s; lx1 += lx;
				ly1 -= ly; ly1 /= s; ly1 += ly;
				var sx1 = (lx1 + 1) / 2 * Math.max(canvas.width, canvas.height);
				var sy1 = canvas.height / 2 + canvas.width / 2 - (ly1 + 1) / 2 * Math.max(canvas.width, canvas.height);
				Pold.x = sx1; Pold.y = sy1;
			}
		} else if (Pold.in) {
			// in - out, set new point to cam plane crossing point
			var t = prel(Pold.p.z, pr.z, 0);
			lx = lerp(Pold.p.x, pr.x, t);
			ly = lerp(Pold.p.y, pr.y, t);
			var s = Math.max(Math.abs(lx), Math.abs(ly)) / 3;
			lx -= Pold.lx; lx /= s; lx += Pold.lx;
			ly -= Pold.ly; ly /= s; ly += Pold.ly;
		} else skipLine = true; // fully behind cam, don't draw

		// transfer [-1, 1] frame to canvas frame
		var sx = (lx + 1) / 2 * Math.max(canvas.width, canvas.height);
		var sy = canvas.height / 2 + canvas.width / 2 - (ly + 1) / 2 * Math.max(canvas.width, canvas.height);

		P = { x: sx, y: sy, lx: lx, ly: ly, in: pr.z > 0, p: pr, moveToPold: moveToPold, skipLine: skipLine };
	},
	moveCheck: function() {
		if (scrn.lookEnabled) {
			scrn.dx = (0.5 - mouse.x / canvas.width) * Math.PI * 3;
			scrn.dy = (mouse.y / canvas.height - 0.5) * Math.PI * 1.5;
			if (scrn.dy < -Math.PI / 2) scrn.dy = -Math.PI / 2;
			if (scrn.dy > Math.PI / 2) scrn.dy = Math.PI / 2;
		}

		if (scrn.moveStyle === "free") {
			var d = new V();
			if (keys[32]) d.y++;
			if (keys[16]) d.y--;
			if (keys[87]) { d.x -= Math.sin(scrn.dx); d.z += Math.cos(scrn.dx); }
			if (keys[83]) { d.x += Math.sin(scrn.dx); d.z -= Math.cos(scrn.dx); }
			if (keys[65]) { d.x -= Math.cos(scrn.dx); d.z -= Math.sin(scrn.dx); }
			if (keys[68]) { d.x += Math.cos(scrn.dx); d.z += Math.sin(scrn.dx); }

			if (keys[189] && !keys[187]) scrn.moveSpeed /= 1.1;
			if (keys[187] && !keys[189]) scrn.moveSpeed *= 1.1;

			d = d.normalize().mult(scrn.moveSpeed);
			scrn.p = scrn.p.add(d);
		} else {
			var center = new V();
			if (scrn.focus instanceof V) center = scrn.focus;
			else center = activeSystem.b[scrn.focus].p;
			scrn.p.x = center.x - scrn.dist * -Math.sin(scrn.dx) * Math.cos(scrn.dy);
			scrn.p.y = center.y - scrn.dist * -Math.sin(scrn.dy);
			scrn.p.z = center.z - scrn.dist * Math.cos(scrn.dx) * Math.cos(scrn.dy);
		}

		while (scrn.dx > Math.PI) scrn.dx -= Math.PI * 2;
		while (scrn.dx <= -Math.PI) scrn.dx += Math.PI * 2;
		while (scrn.dy > Math.PI) scrn.dy -= Math.PI * 2;
		while (scrn.dy <= -Math.PI) scrn.dy += Math.PI * 2;
	}
};

var P = { x: 0, y: 0, lx: 0, ly: 0, in: false, p: new V(), moveToPold: false, skipLine: true };
var Pold = P;

function drawPathStep(v, start) {
	scrn.project(v);
	if (P.skipLine) return;
	if (start) ctx.moveTo(P.x, P.y);
	else {
		if (P.moveToPold) ctx.moveTo(Pold.x, Pold.y);
		ctx.lineTo(P.x, P.y);
	}
};



function System(bodyList) {
	this.b = [];
	this.t = 0;
	this.showBodies = true;
	this.showOrbits = true;
	this.showHistories = true;
	this.hMax = 100000;
	this.speed = 1 / 60;
	this.calcs = 1;
	this.pause = false;
	for (var a in bodyList) this.addBody(bodyList[a]);
};

System.prototype.tick = function() {
	if (this.pause) return;
	for (var a = 0; a < this.calcs; a++) {
		for (var b in this.b) this.b[b].tick();
		this.t++;
		if (scrn.moveStyle === "free") scrn.p = scrn.p.add(this.b[scrn.focus].v.mult(this.speed));
	}
	for (var b in this.b) this.b[b].updateOrbit();
};

System.prototype.draw = function() {
	if (this.showBodies) for (var a = 0; a < this.b.length; a++) this.b[a].draw();
	if (this.showOrbits) for (var a = 0; a < this.b.length; a++) this.b[a].drawOrbit();
	if (this.showHistories)	for (var a = 0; a < this.b.length; a++) this.b[a].drawHistory();
};

System.prototype.addBody = function(body) {
	this.b.push(body);
	body.system = this;
};



function Body(name, p, v, m=0, radius=1, parent, rotation, color="#ffffff") {
	this.name = name;
	this.p = p;
	this.v = v;
	this.m = m;
	this.r = radius;
	this.h = [];
	this.color = color;
	this.show = true;
	this.showHistory = false;
	this.historyRes = 10;
	this.historyRef = "abs";
	this.showOrbit = true;
	this.orbitRes = 5000;
	this.drawDim = 11;
	this.angle = 0;
	this.rotation = rotation;
	this.system = null;
	this.parent = parent;
	this.orbit = new Orbit();
	this.updateOrbit();
};

Body.prototype.tick = function() {
	if (this.system === null) return;
	for (var a = 0; a < this.system.b.length; a++) {
		var b = this.system.b[a];
		if (this == b) continue;
		var rp = this.p.sub(b.p);
		this.v = this.v.add(rp.mult(-G * b.m * this.system.speed / (rp.abs() ** 3)));
	}
	this.p = this.p.add(this.v.mult(this.system.speed));
	this.angle += this.rotation * this.system.speed;
	this.h.push(this.p);
	while (this.h.length > this.system.hMax) this.h.shift();
};

Body.prototype.draw = function() {
	if (!this.show) return;
	ctx.strokeStyle = this.color;
	ctx.beginPath();
	for (var t = 0; t < Math.PI * 2.0025; t += 0.0025 * Math.PI) {
		drawPathStep(new V(Math.cos((this.drawDim - 2) * t) * Math.cos(this.drawDim * t + this.angle), Math.sin((this.drawDim - 2) * t), Math.cos((this.drawDim - 2) * t) * Math.sin(this.drawDim * t + this.angle)).mult(this.r).add(this.p), t === 0);
	}
	ctx.stroke();
};

Body.prototype.drawHistory = function() {
	if (!this.showHistory) return;
	ctx.strokeStyle = this.color;
	ctx.beginPath();
	if (this.parent) {
		for (var a = 0; a < this.h.length; a += this.historyRes) {
			drawPathStep(this.h[a].sub(this.parent.h[a]).add(this.parent.p), a === 0);
		}
		drawPathStep(this.p);
	} else {
		for (var a = 0; a < this.h.length; a += this.pathRes) {
			drawPathStep(this.h[a], a === 0);
		}
		drawPathStep(this.p);
	}
	ctx.stroke();
};

Body.prototype.drawOrbit = function() {
	if (!this.parent || !this.showOrbit) return;
	var o = new Orbit(this.orbit);
	ctx.strokeStyle = this.color;
	ctx.beginPath();
	for (var a = 0; a < Math.PI * 2 * (1 + 1 / this.orbitRes); a += Math.PI * 2 / this.orbitRes) {
		o.anm = this.orbit.anm + a;
		drawPathStep(o.getPos().add(this.parent.p), a === 0);
	}
	ctx.stroke();
};

Body.prototype.updateOrbit = function() {
	if (!this.parent) return;
	this.orbit.setFromPos(this.p.sub(this.parent.p), this.v.sub(this.parent.v), this.parent.m);
};

Body.prototype.setFromOrbit = function(ecc, sma, inc, lan, arg, anm) {
	if (!this.parent) return;
	if (ecc instanceof Orbit) {
		this.orbit = ecc;
	} else {
		this.orbit = new Orbit(ecc, sma, inc, lan, arg, anm);
	}
	this.p = this.orbit.getPos().add(this.parent.p);
	this.v = this.orbit.getVel(this.parent.m).add(this.parent.v);
};



function Orbit(ecc=0, sma=0, inc=0, lan=0, arg=0, anm=0) {
	if (ecc instanceof Orbit) {
		this.ecc = ecc.ecc;
		this.sma = ecc.sma;
		this.inc = ecc.inc;
		this.lan = ecc.lan;
		this.arg = ecc.arg;
		this.anm = ecc.anm;
	} else { // uses degrees, not radians!
		this.ecc = ecc;
		this.sma = sma;
		this.inc = inc * Math.PI/180;
		this.lan = lan * Math.PI/180;
		this.arg = arg * Math.PI/180;
		this.anm = anm * Math.PI/180;
	}
}

Orbit.prototype.setFromPos = function(p, v, m) {
	var K = new V(0, 1, 0);
	var I = new V(0, 0, 1);
	var J = new V(-1, 0, 0);
	var h = p.cross(v);
	var n = K.cross(h);
	var µ = G * m;
	var eccV = p.mult(v.abs2() - µ / p.abs()).sub(v.mult(p.dot(v))).mult(1 / µ);
	var ecc = eccV.abs();
	var mechEnergy = v.abs2() / 2 - µ / p.abs();

	if (Math.abs(ecc) === 1) var sma = h.abs2() / µ;
	else var sma = -µ / (2 * mechEnergy);

	var inc = Math.acos(-h.dot(K) / h.abs());

	if (inc%Math.PI === 0) var lan = 0;
	else var lan = Math.acos(n.dot(I) / n.abs());

	if (ecc === 0) var arg = 0;
	else if (inc%Math.PI === 0) var arg = Math.acos(eccV.dot(I) / ecc);
	else var arg = Math.acos(n.dot(eccV) / (n.abs() * ecc));

	var anm = Math.acos(eccV.dot(p) / (ecc * p.abs()));


	if (n.dot(J) < 0) lan = Math.PI * 2 - lan;
	if (eccV.dot(K) < 0) arg = Math.PI * 2 - arg;
	if (p.dot(v) < 0) anm = Math.PI * 2 - anm;

	this.ecc = ecc;
	this.sma = sma;
	this.inc = inc;
	this.lan = lan;
	this.arg = arg;
	this.anm = anm;
};

Orbit.prototype.getPos = function() {
	if (Math.abs(this.ecc) === 1) var dist = this.sma / (1 + this.ecc * Math.cos(this.anm));
	else var dist = this.sma * (1 - this.ecc * this.ecc) / (1 + this.ecc * Math.cos(this.anm));

	var p1 = new V(dist * -Math.sin(this.anm + this.arg), 0, dist * Math.cos(this.anm + this.arg));

	var p2 = new V(p1.x * Math.cos(this.inc) + p1.y * Math.sin(this.inc), p1.y * Math.cos(this.inc) - p1.x * Math.sin(this.inc), p1.z);

	var p3 = new V(p2.x * Math.cos(this.lan) - p2.z * Math.sin(this.lan), p2.y, p2.z * Math.cos(this.lan) + p2.x * Math.sin(this.lan));

	return p3;
};

Orbit.prototype.getVel = function(centerMass) {
	if (Math.abs(this.ecc) === 1) {
		var dist = this.sma / (1 + this.ecc * Math.cos(this.anm));

		var vx = -this.sma * (Math.cos(this.anm + this.arg) * (1 + this.ecc * Math.cos(this.anm)) + this.ecc * Math.sin(this.anm) * Math.sin(this.anm + this.arg)) / ((1 + this.ecc * Math.cos(this.anm)) ** 2);
		var vz = this.sma * (-Math.sin(this.anm + this.arg) * (1 + this.ecc * Math.cos(this.anm)) + this.ecc * Math.sin(this.anm) * Math.cos(this.anm + this.arg)) / ((1 + this.ecc * Math.cos(this.anm)) ** 2);

	} else {
		var dist = this.sma * (1 - this.ecc * this.ecc) / (1 + this.ecc * Math.cos(this.anm));

		var vx = -this.sma * (1 - this.ecc * this.ecc) * (Math.cos(this.anm + this.arg) * (1 + this.ecc * Math.cos(this.anm)) + this.ecc * Math.sin(this.anm) * Math.sin(this.anm + this.arg)) / ((1 + this.ecc * Math.cos(this.anm)) ** 2);
		var vz = this.sma * (1 - this.ecc * this.ecc) * (-Math.sin(this.anm + this.arg) * (1 + this.ecc * Math.cos(this.anm)) + this.ecc * Math.sin(this.anm) * Math.cos(this.anm + this.arg)) / ((1 + this.ecc * Math.cos(this.anm)) ** 2);
	}

	var vMag = Math.sqrt(G * centerMass * (2 / dist - 1 / this.sma));

	var v1 = new V(vx, 0, vz).normalize().mult(vMag);

	var v2 = new V(v1.x * Math.cos(this.inc) + v1.y * Math.sin(this.inc), v1.y * Math.cos(this.inc) - v1.x * Math.sin(this.inc), v1.z);

	var v3 = new V(v2.x * Math.cos(this.lan) - v2.z * Math.sin(this.lan), v2.y, v2.z * Math.cos(this.lan) + v2.x * Math.sin(this.lan));

	return v3;
};

// -------------------------------------------------------------------

// -------------------------------------------------------------------


scrn.focus = 0;

var G = 0.0000000000667408;
var AU = 149597870700;
var C = 299792458;



var sun = new Body("Sun", new V(), new V(), 1.9885 * 10 ** 30, 696342000, null, 0.00000297188607137, "#f2b33d");
var planet = new Body("Planet", new V(0, 0, AU), new V(30555, 0, 0), 10**24, 6371000, sun, 0, "#004fdf");

var list = [sun, planet];
for (var a = 0; a < 2; a++) {
	list.push(new Body(a, new V(AU * (Math.random() * 2 - 1), AU * (Math.random() * 2 - 1), AU * (Math.random() * 2 - 1)), new V(20000 * (Math.random() * 2 - 1), 20000 * (Math.random() * 2 - 1), 20000 * (Math.random() * 2 - 1)), Math.random() * 10**21, Math.random() * 10**6, sun, 0, "#bfbfbf"));
};



//var solar = new System(____);
var test = new System(list);
var activeSystem = test;

function draw() {
	requestAnimationFrame(draw);

	activeSystem.tick();

	scrn.moveCheck();


	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.lineWidth = 3;
	activeSystem.draw();
	ctx.lineWidth = 1;

	ctx.font = "25px Courier New";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("Speed: " + activeSystem.speed * activeSystem.calcs * 60, 10, 35);
	ctx.fillText("Calcs/sec: " + activeSystem.calcs * 60, 10, 65);
	if (scrn.moveSpeed * activeSystem.speed * activeSystem.calcs * 60 < C / 100) ctx.fillText("Camera speed: " + Math.round(scrn.moveSpeed * activeSystem.speed * activeSystem.calcs * 6000) / 100 + " m/s", 10, 95);
	else ctx.fillText("Camera speed: " + Math.round(scrn.moveSpeed * activeSystem.speed * activeSystem.calcs * 6000 / C) / 100 + "c", 10, 95);
	


	/*
	ctx.strokeStyle = "#ff0000";
	ctx.beginPath();
	scrn.project(new V(-Math.sin(scrn.dx) * Math.cos(scrn.dy), -Math.sin(scrn.dy), Math.cos(scrn.dx) * Math.cos(scrn.dy)).add(scrn.p));
	ctx.moveTo(P.x, P.y);
	scrn.project(new V(0.1 + -Math.sin(scrn.dx) * Math.cos(scrn.dy), -Math.sin(scrn.dy), Math.cos(scrn.dx) * Math.cos(scrn.dy)).add(scrn.p));
	ctx.lineTo(P.x, P.y);
	ctx.stroke();

	ctx.strokeStyle = "#00ff00";
	ctx.beginPath();
	scrn.project(new V(-Math.sin(scrn.dx) * Math.cos(scrn.dy), -Math.sin(scrn.dy), Math.cos(scrn.dx) * Math.cos(scrn.dy)).add(scrn.p));
	ctx.moveTo(P.x, P.y);
	scrn.project(new V(-Math.sin(scrn.dx) * Math.cos(scrn.dy), 0.1 + -Math.sin(scrn.dy), Math.cos(scrn.dx) * Math.cos(scrn.dy)).add(scrn.p));
	ctx.lineTo(P.x, P.y);
	ctx.stroke();

	ctx.strokeStyle = "#0000ff";
	ctx.beginPath();
	scrn.project(new V(-Math.sin(scrn.dx) * Math.cos(scrn.dy), -Math.sin(scrn.dy), Math.cos(scrn.dx) * Math.cos(scrn.dy)).add(scrn.p));
	ctx.moveTo(P.x, P.y);
	scrn.project(new V(-Math.sin(scrn.dx) * Math.cos(scrn.dy), -Math.sin(scrn.dy), 0.1 + Math.cos(scrn.dx) * Math.cos(scrn.dy)).add(scrn.p));
	ctx.lineTo(P.x, P.y);
	ctx.stroke();
	*/

}

draw();