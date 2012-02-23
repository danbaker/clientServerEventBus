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
	
	// map from eventID to array of client-side sockets that have subscribed to an eventID
	this.subscriptions = {};
	
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
		//console.log("Server PubSub slow delegate:  eventID="+eventID);
		self.doSlowDelegatePublish(eventID, args);
	});
};

/**
 * an event was just published ON this server, and is ready to be re-published to clients
 * @param {string} eventID  The eventID to re-published to the clients that subscribed to it
 * @param {*} args  The arguments to publish with the eventID
 */
UT.Socket.prototype.doSlowDelegatePublish = function(eventID, args) {
	//console.log("SlowDelegatePublish: eventID="+eventID);
	var arr;
	var idx;
	var max;
	var socket;
	if (this.subscriptions && this.subscriptions[eventID]) {
		arr = this.subscriptions[eventID];
		// at least one client subscribed to this eventID
		max = arr.length;
		for(idx = 0; idx<max; idx++) {
			socket = arr[idx];
			if (socket) {
				// send this event to this one client that subscribed to it
				socket.emit('PubSubPublish', { eventID:eventID, args:args } );
			}
		}
	}
};

/**
 * an event was just published to this server from a single client
 * @param {*} data  The event data object
 * @param (*) socket  The socket to the client that published the event
 */
UT.Socket.prototype.doPublishedEvent = function(data, socket) {
	var eventID = data.eventID;					// eventID ("cmd.file.open")
	var args = data.args || {};				// event arguments
	this.log("FromClient: publish eventID="+data.eventID);
	if (this.pb) {
		// include the client-socket with the args (so all local subscribers can talk back to the client)
		args.socket = socket;
		// pass this client-side published event along to every subscriber on this server
		this.pb.publish(eventID, args);
	}
};

/**
 * A single client (socket.id) just requested to subscribe to a server-event (data.eventID)
 * @param {*} data  The event data object to subscribe to  { eventID:'cmd.btn.1' }
 * @param (*) socket  The socket to the client that is subscribing
 */
UT.Socket.prototype.doSubscribeToEvent = function(data, socket) {
	//console.log("A single client is subscribing to a server-event: client="+socket.id+" event="+data.eventID);
	// remember the eventID and which client subscribed to it
	var eventID = data.eventID;
	this.log("FromClient: subscribe eventID="+data.eventID+"   from socketID="+socket.id);
	if (!this.subscriptions[eventID]) {
		// first client to subscribe to this event
		this.subscriptions[eventID] = [];
	}
	this.subscriptions[eventID].push(socket);

	// make sure this server-PubSub will publish this event to the clients over the slow-connection
	this.pb.subscribeSlow(eventID);
};

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
		socket.on("PubSubPublish", function(data) {
			// Client publishing a subscribed-to-event to this server
			self.doPublishedEvent(data, socket);
		});
		socket.on('PubSubSubscribe', function (data) {
			// Client (socket.id) is subscribing to a server-side event (data.eventID)
			self.doSubscribeToEvent(data, socket);
		});

		this.log("New UT Connection.  client id="+socket.id+"  total connections="+this.nConnections);
		// allow anyone to handle this new client connection
		this.pb.publish('onConnect', { socket: socket } );
		// inform the client they have successfully connected (Note: also happens on auto-reconnect)
		this.log("... sending 'connect' to client socket id="+socket.id);
		socket.emit("PubSubConnect");
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
		this.log("UT Disconnection.  client id="+socket.id+"  total connections="+this.nConnections);
		delete this.allConnections[socket.s];
		this.nConnections--;
		// @TODO: walk all this.subscriptions and remove this socket from everywhere!
		this.pb.publish('onDisconnect', { socket: socket } );
	} else {
		this.log("ERROR: unknown client disconnected");
	}
};


UT.Socket.prototype.log = function(msg) {
	//console.log(msg);
};

var exports;
if (exports) console.log("ON SERVER");
else console.log("ON CLIENT");

// EXPORTING
exports.create = UT.Socket.create;
exports.getInstance = UT.Socket.getInstance;

