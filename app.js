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


var utsock = utsocket.getInstance();
utsock.listen(io, pb);

app.listen(8765);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);



// TESTING CODE BELOW ...
pb.subscribe('onConnect', function(eventID, args) {
	// a new client just connected to this server ...
	if (args && args.socket) {
		console.log("New client connected.  socketID="+args.socket.id);
		args.socket.emit("subscribe", { eventID: "cmd.btn.1" });
	} else {
		console.log("WARNING: Got a onConnect event without a socket");
	}
});
pb.subscribe('onDisconnect', function(eventID, args) {
	// an old client just disconnected
	console.log("Old client Dis-connected.  socketID="+args.socket.id);
});
pb.subscribe("cmd.btn.1", function(eventID, data) {
	console.log("Just got event: "+eventID);
	if (data && data.socket) console.log(".. came from a client.  Got socket to reply to that one client.");
	// @TODO: process this event.
	console.log("Publishing cmd.btn.2 ...");
	pb.publish("cmd.btn.2");

});
pb.subscribe("cmd.btn.2", function(eventID, data) {
	console.log("Just got event: "+eventID);
	if (data && data.socket) console.log(".. came from a client.  Got socket to reply to that one client.");
});
