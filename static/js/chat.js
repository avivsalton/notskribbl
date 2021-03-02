$(document).ready(function() {

	var socket = io.connect('http://127.0.0.1'); // Connects to server through socket.io

	// When 'enter' key is pressed, send message in text box
	$('#chatinput').keypress(function(e){
		if(e.keyCode==13)
		{
	    	socket.send("message$%*!" + appConfig.username + "$%*!" + appConfig.color + "$%*!" + $('#chatinput').val());
			$('#chatinput').val('');
		}

		// Empty the text box after hitting enter
		var input = $('#chatinput').val();
		$('#chatinput').val(input);

    });

	// Sends to server a message when connecting to the site
    socket.on('connect', function() {
    	socket.send("connect$%*!" + appConfig.username);
    });

    //--FIX--: Sends to server a message when disconnecting from the site
    socket.on('disconnect', function() {
    	socket.send("disconnect$%*!" + appConfig.username);
    });

    // When receiving a message print it out
    // Chat messages are sent and recieved like that:
    // 'message$%*!{username}$%*!{username_color}$%*!{message}' 
	socket.on('message', function(msg) {
		var res = msg.split("$%*!");

		// Receiving a regular chat message
		if (res[0] == "message")
		{	
			$("#messages").append('<div class="message"><div class="user" style="color: ' + res[2] + ';">' + res[1] + '</div><div class="text">'+ res[3] +'</div></div>');

		}

		// Receiving a connection message
		if (res[0] == "connect")
		{
			$("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #339933; text-align: center;">' + res[1] + ' has connected</div>');
		} 

		// Receiving a disconnection message
		if (res[0] == "disconnect")
		{
			$("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #cc0000; text-align: center;">' + res[1] + ' has disconnected</div>');
		}
	});
});