// UT.Socket
// Handle SocketIO management
// Usage:
//	var utsocket = require('Socket');
//	var uts = utsocket.create();
//	uts.listen();

var UT = {};

/**
 * @constructor
 */
UT.Socket = function() {};

/**
 * main create method (see getInstance too)
 * @return {UT.Socket}
 */
UT.Socket.create = function() {
	var res = new UT.Socket();
	res.init();
	return res;
};

/**
 * To use the "main singleton" Socket
 * @return {UT.Socket}
 */
UT.Socket.getInstance = function() {
	if (!UT.Socket._singleton) {
		UT.Socket._singleton = UT.Socket.create();
	}
	return UT.Socket._singleton;
};

UT.Socket.prototype.init = function() {
	// collection of all current connections
	this.allConnections = {};
	// total current connections
	this.nConnections = 0;
	
	// the "socket io namespace" to use
	this.ns = "UT";
};

/**
 * listen to an app and listen for connect and disconnect events
 * Note: start up the Socket handler
 * Note: you MUST call this before calling "app.listen(PORT)"
 * @param {*=} io  (optional) The SocketIO variable returned from "io.listen(app)"
 * @param {*=} app  (optional) The application that will be listening (if not passed in, assumed to already be listening)
 * @param {string=} ns  (optional) namespace to use (defaults to "UT")
 */
UT.Socket.prototype.listen = function(io, app, ns) {
	var self = this;
	if (io) {
		this.io = io;
	}
	if (app) {
		this.io.listen(app);
	}
	if (ns) {
		this.ns = ns;
	}
	this.log("UT.Socket.listening to namespace: "+this.ns);
	var theNS = this.io.of("/"+this.ns);
	theNS.on('connection', function (socket) {
		self.doConnect(socket);
		socket.on('disconnect', function () {
			self.doDisconnect(socket);
		});
		socket.on('event', function (data) {
			self.log("UT.EVENT:");
			self.log(data);
		});
		// QUESTION: How do we add listen events here, later ?
//		socket.on('my other event', function (data) {
//			this.log(data);
//		});
	});
};


/**
 * a new client just connected
 * @param {*} socket  The socket that just connected
 */
UT.Socket.prototype.doConnect = function(socket) {
	if (socket && socket.id && !this.allConnections[socket.id]) {
		// NEW client just connected.  Remember this client info.
		this.allConnections[socket.id] = {};
		this.nConnections++;
		this.log("New UT Connection.  client id="+socket.id+"  total connections="+this.nConnections);
	} else {
		this.log("ERROR: Same client connection ID used twice");
	}
};

//existing client just disconnected
/**
 * a previously-connected client just disconnected
 * @param {*} socket  The socket that just disconnected
 */
UT.Socket.prototype.doDisconnect = function(socket) {
	if (socket && socket.id) {
		delete this.allConnections[socket.id];
		this.nConnections--;
		this.log("UT Disconnection.  client id="+socket.id+"  total connections="+this.nConnections);
	} else {
		this.log("ERROR: unknown client disconnected");
	}
};


UT.Socket.prototype.log = function(msg) {
	console.log(msg);
};

// EXPORTING
exports.create = UT.Socket.create;
exports.getInstance = UT.Socket.getInstance;

