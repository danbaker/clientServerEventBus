/**
 * Module dependencies.
 */

var express = require('express');
var pubsub = require('./www/public/js/UT/PubSub');

var app = express.createServer();
var io = require('socket.io').listen(app);
var utsocket = require('./UT/Socket');

// Configuration

io.configure(function(){
  io.set('log level', 1);
});

app.configure(function(){
  app.set('views', __dirname + '/www/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/www/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'UtahJS: PubSub'
  });
});


// Final Setup

var pb = pubsub.getInstance();
pb.subscribe("cmd.btn.1", function(eventID, data) {
	console.log("Just got event: "+eventID);
	if (data.socket) console.log(".. came from a client.  Got socket to reply to that one client.");
	// @TODO: process this event.

});
pb.publish("EventA");


var utsock = utsocket.getInstance();
utsock.listen(io, pb);

app.listen(8765);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// // // // // // // // // // // // // // // // //
//
//	 	Handle General Socket.IO
//
// Note: we may NOT need this...
/*
var allConnections = {};
var nConnections = 0;

// new client just connected
var doConnect = function(socket) {
	if (socket && socket.id && !allConnections[socket.id]) {
		allConnections[socket.id] = {};
		nConnections++;
		console.log("New Connection.  client id="+socket.id+"  total connections="+nConnections);
	} else {
		console.log("ERROR: Same client connection ID used twice");
	}
};
//existing client just disconnected
var doDisconnect = function(socket) {
	if (socket && socket.id) {
		delete allConnections[socket.id];
		nConnections--;
		console.log("Disconnection.  client id="+socket.id+"  total connections="+nConnections);
	} else {
		console.log("ERROR: unknown client disconnected");
	}
};

io.sockets.on('connection', function (socket) {
	doConnect(socket);
	socket.emit('news', { hello: 'world' });

	socket.on('my other event', function (data) {
		console.log(data);
	});
	socket.on('disconnect', function () {
		doDisconnect(socket);
	});
});
*/