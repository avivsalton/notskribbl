$(document).ready(function() {

	var socket = io.connect('http://' + appConfig.ip); // Connects to server through socket.io

	// When 'enter' key is pressed, send message in text box
	$('#chatinput').keypress(function(e){
		if(e.keyCode==13)
		{
	    	socket.send("message$%*!" + appConfig.username + "$%*!" + appConfig.roomid + "$%*!" + appConfig.color + "$%*!" + $('#chatinput').val());
			$('#chatinput').val('');
		}

		// Empty the text box after hitting enter
		var input = $('#chatinput').val();
		$('#chatinput').val(input);

    });

	// Sends to server a message when connecting to the site
    socket.on('connect', function() {
    	socket.send("connect$%*!" + appConfig.username + "$%*!" + appConfig.roomid);
    });

    //--FIX--: Sends to server a message when disconnecting from the site
    socket.on('disconnect', function() {
    	socket.send("disconnect$%*!" + appConfig.username + "$%*!" + appConfig.roomid);
    });

    // When receiving a message print it out
    // Chat messages are sent and recieved like that:
    // 'message$%*!{username}$%*!{username_color}$%*!{message}' 
	socket.on('message', function(msg) {
		var res = msg.split("$%*!");

		// Receiving a regular chat message
		if (res[2] == appConfig.roomid)
		{
			if (res[0] == "message")
			{	
				$("#messages").append('<div class="message"><div class="user" style="color: ' + res[3] + ';">' + res[1] + '</div><div class="text">'+ res[4] +'</div></div>');

			}

			// Receiving a connection message
			if (res[0] == "connect")
			{
				$("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #339933; text-align: center;">' + res[1] + ' has connected</div>');
				$("#players").append('<div class="gamer"><div class="user">' + res[1] + '</div><div class="points" id="points">Points: 0</div></div>');
			}

			if (res[0] == "connected")
			{
				if (res[1] != appConfig.username)
				{
					$("#players").append('<div class="gamer"><div class="user">' + res[1] + '</div><div class="points" id="points">Points: 0</div></div>');
				}
			}

			// Receiving a disconnection message
			if (res[0] == "disconnect")
			{
				$("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #cc0000; text-align: center;">' + res[1] + ' has disconnected</div>');
			}
		}
	});
});