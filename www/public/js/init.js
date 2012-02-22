// THE first JavaScript loaded

setTimeout(function() {
	// get THE PubSub object
	var pb = UT.PubSub.getInstance();



// -----------------------------
// @TODO: Move the following chunk of code into a nice neat PubSubSocket package
// @TODO: Write the Server-Side PubSub package

	// Connect to the node.js UT.PubSub server ("UT")
	var socket = io.connect('http://localhost:8765/UT');
	console.log(socket);
	socket.on('PubSubConnect', function (data) {
		console.log("SERVER INFORMED ME I AM NOW CONNECTED");
		socket.emit('PubSubSubscribe', { eventID:'cmd.btn.2' } );
	});
	socket.on('PubSubSubscribe', function (data) {
		console.log(socket);
		console.log("SERVER SUBSCRIBE-REQUEST for eventID="+data.eventID+"  (about to tell local PubSub to send this event to server when it is published locally)");
		console.log(data);
		pb.subscribeSlow(data.eventID);
	});
	socket.on('PubSubPublish', function (data) {
		console.log("SERVER PUBLISH-REQUEST for eventID="+data.eventID+"  (server just published this event, and published it here too)");
		console.log(data);
		pb.publish(data.eventID, data.args);
	});
	// setup PubSub for sending published events to server
	pb.setSlowDelegate(function(options, eventID, args) {
		console.log("Client PubSub slow delegate.  eventID="+eventID);
		socket.emit('PubSubPublish', { eventID:eventID, args:args });
	});
// -----------------------------

	
	var contentLines = 1;
	var content = document.getElementById("content");
	var contentN = 1;
	content.innerHTML = "Hello World<br>";
	
	// add a 1 line message to the content area
	var addMessage = function(msg) {
		var txt = content.innerHTML;
		while (contentLines > 10) {
			var idx = txt.indexOf("<br>");
			if (idx < 0) break;
			txt = txt.substring(idx+4);
			contentLines--;
		}
		contentLines++;
		txt += "" + contentN + ": " + msg + "<br>";
		contentN++;
		content.innerHTML = txt;
	};
	
	pb.subscribe("cmd.btn.1", function(args) {
		addMessage("Button 1 Pressed at client");
	});
	pb.subscribe("cmd.btn.2", function(args) {
		addMessage("Button 2 Pressed at client");
	});
	
	var btn1 = document.getElementById("btn1")
	btn1.onclick = function() {
		pb.publish("cmd.btn.1", {btn1:true});
	};
	var btn2 = document.getElementById("btn2")
	btn2.onclick = function() {
		pb.publish("cmd.btn.2");
	};
}, 500);

/*  TO DO

Create EVENTS

client subscribe to "btn1Pushed" event ... output message
btn1.onclick publish "btn1Pushed" event
*/

var exports;
if (exports) console.log("ON SERVER");
else console.log("ON CLIENT");
