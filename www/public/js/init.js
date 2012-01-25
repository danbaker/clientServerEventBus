// THE first JavaScript loaded

var socket = io.connect('http://localhost:8765');
socket.on('news', function (data) {
	console.log(data);
	socket.emit('my other event', { my: 'data' });
});



