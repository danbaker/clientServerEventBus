// THE first JavaScript loaded

setTimeout(function() {
	// get THE PubSub object
	var pb = UT.PubSub.getInstance();

	// Connect to the node.js UT.PubSub server ("UT")
	var socket = io.connect('http://localhost:8765/UT');
	socket.on('news', function (data) {
		console.log(data);
		socket.emit('my other event', { my: 'data' });
	});
	socket.emit('event', { my: 'data' });
	
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
		pb.publish("cmd.btn.1");
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