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
	
	
	this.io = null;			// io manager
	this.pb = null;			// PubSub manager
	this.app = null;		// app
	this.ns = "UT";			// the "socket io namespace" to use
};

/**
 * listen to an app and listen for connect and disconnect events
 * Note: start up the Socket handler
 * Note: you MUST call this before calling "app.listen(PORT)"
 * @param {*=} io  (optional) The SocketIO variable returned from "io.listen(app)"
 * @param {*=} io  (optional) The PubSub instance to work with
 * @param {*=} app  (optional) The application that will be listening (if not passed in, assumed to already be listening)
 * @param {string=} ns  (optional) namespace to use (defaults to "UT")
 */
UT.Socket.prototype.listen = function(io, pb, app, ns) {
	var self = this;
	if (io) {
		this.io = io;
	}
	if (pb) {
		this.pb = pb;
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
	});
	pb.setSlowDelegate(function(options, eventID, args) {
		console.log("Server PubSub slow delegate:  eventID="+eventID);
		console.log("@TODO: publish this event to EACH socket that subscribed to this event");
//		socket.emit('publish', { id:eventID, args:args });
	});
};

/**
 * an event was just published to this server from a single client
 * @param {*} data  The event data object
 * @param (*) socket  The socket to the client that published the event
 */
UT.Socket.prototype.doPublishedEvent = function(data, socket) {
	var eventID = data.id;					// eventID ("cmd.file.open")
	var args = data.args || {};				// event arguments
	this.log("UT.EVENT:  id="+eventID);
	this.log(data);
	if (this.pb) {
		// include the client-socket with the args (so all local subscribers can talk back to the client)
		args.socket = socket;
		// pass this client-side published event along to every subscriber on this server
		this.pb.publish(eventID, args);
	}
}

/**
 * a new client just connected
 * @param {*} socket  The socket that just connected
 */
UT.Socket.prototype.doConnect = function(socket) {
	var self = this;
	if (socket && socket.id && !this.allConnections[socket.id]) {
		// NEW client just connected.  Remember this client info.
		this.allConnections[socket.id] = {};
		this.nConnections++;
		socket.on("publish", function(data) {
			// Client publishing a subscribed-to-event to this server
			self.doPublishedEvent(data, socket);
		});
		socket.on('subscribe', function (data) {
			console.log("A single client is subscribing to a server-event: client="+socket.id+" event="+data.eventID);
			console.log("@TODO: track client-id with the eventID");
			console.log(data);
			// make sure that this event will call the "slow function" when published
			// @TODO: make the "slow function" walk the list of client-id's subscribed to this eventID
			pb.subscribeSlow(data.eventID);
		});

		this.log("New UT Connection.  client id="+socket.id+"  total connections="+this.nConnections);

		this.log("TEMP: Subscribing to cmd.btn.1 on this new client");
		socket.emit("subscribe", { eventID: "cmd.btn.1" });
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

var exports;
if (exports) console.log("ON SERVER");
else console.log("ON CLIENT");

// EXPORTING
exports.create = UT.Socket.create;
exports.getInstance = UT.Socket.getInstance;

