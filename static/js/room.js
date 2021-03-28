$(document).ready(function() {

	var socket = io.connect('http://' + appConfig.ip); // Connects to server through socket.io
	var button = document.getElementById("startgame");
	var roundsbar = document.getElementById("rounds");

	if (appConfig.isRoomAdmin == "False")
	{
		button.style.background = "#aaaaaa";
		button.disabled = true;
		roundsbar.disabled = true;
	}

	roundsbar.onchange = function(){
		socket.send("changeroundbar$%*!" + appConfig.roomid + "$%*!" + roundsbar.selectedIndex);
	}

	socket.on('connect', function() {
    	socket.send("roomconnect$%*!" + appConfig.username + "$%*!" + appConfig.roomid);
    });

    socket.on('message', function(msg) {
    	var res = msg.split("$%*!");
    	if (res[0] == "roomconnect" && res[2] == appConfig.roomid) {
    		$("#players").append('<div class="gamer"><div class="user">' + res[1] + '</div></div>');
    	}

    	if (res[0] == "changeroundbar" && appConfig.isRoomAdmin == "False" && res[1] == appConfig.roomid)
    	{
    		var i = parseInt(res[2]);
    		roundsbar.selectedIndex = i;
    	}

    	if (res[0] == "startgame")
    	{
    		alert("Starting game...")
    	} 
    });

    button.onclick = function () {
    	socket.send("startgame$%*!" + appConfig.roomid);
    }
});
