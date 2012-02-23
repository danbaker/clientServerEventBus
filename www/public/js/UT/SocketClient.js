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
};

/**
 * setup this Client Socket handler
 * @param {*} pb  PubSub instance to use  ( UT.PubSub.getInstance();)
 * @param {*} socket Socket.IO instance already connected to the server  (io.connect('http://localhost:8765/UT');)
 */
UT.SocketClient.prototype.setup = function(pb, socket) {
	this._pb = pb;
	this._socket = socket;
	// setup the socket.io socket for known PubSub events
	socket.on('PubSubConnect', function (data) {
		// server just informed this client that it is now connected to the server
		// re-publish this event to the entire client
		pb.publish('PubSubConnect', data);
	});
	socket.on('PubSubSubscribe', function (data) {
		// server just requested to subscribe to an event on this client
		//	meaning: when the event is published on this client, send it to the server to be re-published
		//console.log("SERVER SUBSCRIBE-REQUEST for eventID="+data.eventID+"  (about to tell local PubSub to send this event to server when it is published locally)");
		//console.log(data);
		pb.subscribeSlow(data.eventID);
	});
	socket.on('PubSubPublish', function (data) {
		// server just requested to re-publish an event on this client
		//console.log("SERVER PUBLISH-REQUEST for eventID="+data.eventID+"  (server just published this event, and published it here too)");
		//console.log(data);
		pb.publish(data.eventID, data.args);
	});
	// setup PubSub for sending published events to server
	pb.setSlowDelegate(function(options, eventID, args) {
		// this client just published an event that had previously been subscribed to from the server
		//console.log("Client PubSub slow delegate.  eventID="+eventID);
		socket.emit('PubSubPublish', { eventID:eventID, args:args });
	});
};


/**
 * allow this client to subscribe to events that will be published on the server
 * @param {string} eventID  The id of the event to subscribe to on the server
 */
UT.SocketClient.prototype.subscribe = function(eventID) {
	this._socket.emit('PubSubSubscribe', { eventID:eventID });
};

		
		
		
		