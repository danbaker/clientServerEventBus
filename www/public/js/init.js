// THE first JavaScript loaded

setTimeout(function() {
	// get THE PubSub object
	var pb = UT.PubSub.getInstance();

	var socket = io.connect('http://localhost:8765/UT');
	var socketClient = UT.SocketClient.getInstance();
	socketClient.setup(pb, socket);

	// setup this client for events from server
	pb.subscribe('PubSubConnect', function(data) {
		console.log("SERVER INFORMED ME I AM NOW CONNECTED");
		// subscribe to events that happen on the server
		socketClient.subscribe('cmd.btn.2');
	});
	
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
