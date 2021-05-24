$(document).ready(function() {

	var isVisible = true;
    var users = [];
	var socket = io.connect('http://' + appConfig.ip); // Connects to server through socket.io
	socket.send("requestPlayers$%*!" + appConfig.roomid + "$%*!" + appConfig.username);

	// When 'enter' key is pressed, send message in text box
	$('#chatinput').keypress(function(e){
		if(e.keyCode==13)
		{
			if (isVisible == true && $('#chatinput').val() != "")
			{
		    	socket.send("message$%*!" + appConfig.username + "$%*!" + appConfig.roomid + "$%*!" + appConfig.color + "$%*!" + $('#chatinput').val());
				$('#chatinput').val('');
			}

			else if ($('#chatinput').val() != "")
			{
				$("#messages").append('<div class="message"><div class="user" style="color: ' + appConfig.color + ';">' + appConfig.username + ' (invisible)</div><div class="text">'+ $('#chatinput').val() +'</div></div>');
			}
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

			if (res[0] == "found")
			{
				$("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #339933; text-align: center;">' + res[1] + ' has found the word</div>');
				document.getElementById(res[1] + '_points').innerHTML = "Points: " + res[3];

				if (res[1] == appConfig.username)
				{
					isVisable = false;
				}
			}

			// Receiving a connection message
			if (res[0] == "connect" && !users.includes(res[1]))
			{
			    if (res[1] != "Bot")
			    {
                    $("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #339933; text-align: center;">' + res[1] + ' has connected</div>');
				}

				$("#players").append('<div class="gamer"><div class="user">' + res[1] + '</div><div class="points" id="' + res[1] + '_points">Points: 0</div></div>');

				users.push(res[1]);

			}

			if (res[0] == "connected")
			{
				if (res[1] != appConfig.username)
				{
					$("#players").append('<div class="gamer"><div class="user">' + res[1] + '</div><div class="points" id="points">Points: 0</div></div>');
				}
			}

			if (res[0] == "visible")
			{
			    isVisible = true;
			}

			// Receiving a disconnection message
			if (res[0] == "disconnect")
			{
				$("#messages").append('<div class="message" style="height: 30px;"><div class="user" style="color: #cc0000; text-align: center;">' + res[1] + ' has disconnected</div>');
			}
		}
	});
});