$(document).ready(function() {

	var socket = io.connect('http://127.0.0.1');

	socket.on('message', function(msg) {
		var res = msg.split("$%*!");
		if (res[0] == "message")
		{	
			$("#messages").append('<div class="message"><div class="user" style="color: ' + res[2] + '">' + res[1] + '</div><div class="text">'+ res[3] +'</div></div>');
				console.log('Received message');

		} 
	});

	$('#submit').on('click', function() {
		socket.send("message$%*!" + appConfig.username + "$%*!" + appConfig.color + "$%*!" + $('#chatinput').val());
		$('#chatinput').val('');
	});

});