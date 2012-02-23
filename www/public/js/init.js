// THE first JavaScript loaded

/*  TO DO

--Create EVENTS
--Have server send the current state of the 5 checkboxes to the client onConnect


*/


setTimeout(function() {
	// get THE PubSub object
	var pb = UT.PubSub.getInstance();

	var socket = io.connect('http://localhost:8765/UT');
	var socketClient = UT.SocketClient.getInstance();
	socketClient.setup(pb, socket);
	var firstTime = true;

	// setup this client for events from server
	pb.subscribe('PubSubConnect', function(data) {
		console.log("SERVER INFORMED ME I AM NOW CONNECTED.  firstTime="+firstTime);
		// only subscribe on client IF this is the first time connected
		// Note: the 2nd time, we have already subscribed locally
		socketClient.setSubcribeClientServer(firstTime, true);
		// subscribe to events that happen on the server AND locally
		socketClient.subscribe("cmd.btn.1", function(args) {
			addMessage("Button 1 event");
			pb.publish("cmd.btn", {btn:1});
		});
		socketClient.subscribe("cmd.btn.2", function(args) {
			addMessage("Button 2 event");
			pb.publish("cmd.btn", {btn:2});
		});
		socketClient.subscribe("cmd.btn.3", function(args) {
			addMessage("Button 3 event");
			pb.publish("cmd.btn", {btn:3});
		});
		socketClient.subscribe("cmd.btn.4", function(args) {
			addMessage("Button 4 event");
			pb.publish("cmd.btn", {btn:4});
		});
		socketClient.subscribe("cmd.btn.5", function(args) {
			addMessage("Button 5 event");
			pb.publish("cmd.btn", {btn:5});
		});
		firstTime = false;
		// reset to default setting
		socketClient.setSubcribeClientServer();
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
	
	var btn1 = document.getElementById("btn1");
	btn1.onclick = function() {
		pb.publish("cmd.btn.1");
	};
	var btn2 = document.getElementById("btn2");
	btn2.onclick = function() {
		pb.publish("cmd.btn.2");
	};
	var btn3 = document.getElementById("btn3");
	btn3.onclick = function() {
		pb.publish("cmd.btn.3");
	};
	var btn4 = document.getElementById("btn4");
	btn4.onclick = function() {
		pb.publish("cmd.btn.4");
	};
	var btn5 = document.getElementById("btn5");
	btn5.onclick = function() {
		pb.publish("cmd.btn.5");
	};
	var chk1 = document.getElementById("chk1");
	chk1.onclick = function() {
		pb.publish("cmd.chk", {chk:1, checked:chk1.checked});
	};
	var chk2 = document.getElementById("chk2");
	chk2.onclick = function() {
		pb.publish("cmd.chk", {chk:2, checked:chk2.checked});
	};
	var chk3 = document.getElementById("chk3");
	chk3.onclick = function() {
		pb.publish("cmd.chk", {chk:3, checked:chk3.checked});
	};
	var chk4 = document.getElementById("chk4");
	chk4.onclick = function() {
		pb.publish("cmd.chk", {chk:4, checked:chk4.checked});
	};
	var chk5 = document.getElementById("chk5")
	chk5.onclick = function() {
		pb.publish("cmd.chk", {chk:5, checked:chk5.checked});
	};
}, 500);

var exports;
if (exports) console.log("ON SERVER");
else console.log("ON CLIENT");
