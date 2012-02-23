// UT.SocketClient
//	SocketClient is a helper class to help with socket.io AND UT.PubSub
//




if (!UT) UT = {};

/**
 * @constructor
 */
UT.SocketClient = function() {};

UT.SocketClient.create = function() {
	var res = new UT.SocketClient();
	res.init();
	return res;
};

/**
 * To use the "main singleton" SocketClient
 * @return {UT.SocketClient}
 */
UT.SocketClient.getInstance = function() {
	if (!UT.SocketClient._singleton) {
		UT.SocketClient._singleton = UT.SocketClient.create();
	}
	return UT.SocketClient._singleton;
};

UT.SocketClient.prototype.init = function() {
	this._pb = null;
	this._socket = null;
	this.setSubcribeClientServer();
};

/**
 * setup this Client Socket handler
 * @param {*} pb  PubSub instance to use  ( UT.PubSub.getInstance();)
 * @param {*} socket Socket.IO instance already connected to the server  (io.connect('http://localhost:8765/UT');)
 */
UT.SocketClient.prototype.setup = function(pb, socket) {
	var self = this;
	this._pb = pb;
	this._socket = socket;
	// setup the socket.io socket for known PubSub events
	socket.on('PubSubConnect', function (data) {
		self.log("PubSubConnect");
		// server just informed this client that it is now connected to the server
		// re-publish this event to the entire client
		pb.publish('PubSubConnect', data);
	});
	socket.on('PubSubSubscribe', function (data) {
		self.log("PubSubSubscribe: eventID="+data.eventID);
		// server just requested to subscribe to an event on this client
		//	meaning: when the event is published on this client, send it to the server to be re-published
		//console.log("SERVER SUBSCRIBE-REQUEST for eventID="+data.eventID+"  (about to tell local PubSub to send this event to server when it is published locally)");
		//console.log(data);
		pb.subscribeSlow(data.eventID);
	});
	socket.on('PubSubPublish', function (data) {
		self.log("PubSubPublish: eventID="+data.eventID);
		// server just requested to re-publish an event on this client
		//console.log("SERVER PUBLISH-REQUEST for eventID="+data.eventID+"  (server just published this event, and published it here too)");
		//console.log(data);
		pb.publish(data.eventID, data.args);
	});
	// setup PubSub for sending published events to server
	pb.setSlowDelegate(function(options, eventID, args) {
		self.log("slowDelegate: eventID="+eventID);
		// this client just published an event that had previously been subscribed to from the server
		//console.log("Client PubSub slow delegate.  eventID="+eventID);
		socket.emit('PubSubPublish', { eventID:eventID, args:args });
	});
};

/**
 * allow this client to subscribe to events that will be published on the server AND on this local client
 * @param {string} eventID  The id of the event to subscribe to on the server
 * @param {Function=} fnc  The function to call when the eventID is published (from locally or server)
 * @param {Object=} obj  The object that the function is a part of (the "this" ptr for the function)
 * @return {*}  Handle to your subscribed-to event
 */
UT.SocketClient.prototype.subscribe = function(eventID, fnc, obj) {
	if (this._onServer) {
		this._socket.emit('PubSubSubscribe', { eventID:eventID });
	}
	if (fnc && this._onClient) {
		return this._pb.subscribe(eventID, fnc, obj);
	}
	return null;
};

/**
 * describe how the "subscribe" function works with subscribing locally and on the server
 * @param {boolean} onClient  true means to subscribe on this local client (defaults to true)
 * @param {boolean} onServer  true means to subscribe on the server (defaults to true)
 */
UT.SocketClient.prototype.setSubcribeClientServer = function(onClient, onServer) {
	if (onClient === undefined) onClient = true;
	if (onServer === undefined) onServer = true;
	this._onClient = onClient;
	this._onServer = onServer;
};

UT.SocketClient.prototype.log = function(msg) {
	//console.log(msg);
};

