$(document).ready(function() {

	var socket = io.connect('http://' + appConfig.ip); // Connects to server through socket.io
	var button = document.getElementById("startgame");
	var botbox = document.getElementById("isBot");
	var roundsbar = document.getElementById("rounds");

	roundsbar.selectedIndex = parseInt(appConfig.rounds);

	if (appConfig.isRoomAdmin == "False")
	{
		button.style.background = "#aaaaaa";
		button.disabled = true;
		roundsbar.disabled = true;
		document.getElementById("isBot").disabled = true;
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

    	if (res[0] == "botcheckbox" && appConfig.isRoomAdmin == "False" && res[1] == appConfig.roomid)
    	{
            if (botbox.checked == false)
            {
                botbox.checked = true;
    		}
    		else
    		{
    		    botbox.checked = false;
    		}
    	}

    	if (res[0] == "startgame")
    	{
    		var form = document.createElement("form");
    		form.setAttribute("method", "POST");

    		var f = document.createElement("input");
    		f.setAttribute("name", "username");
    		f.setAttribute("type", "hidden");
    		f.setAttribute("value", appConfig.username);
    		form.appendChild(f);

    		var f1 = document.createElement("input");
    		f1.setAttribute("name", "color");
    		f1.setAttribute("type", "hidden");
    		f1.setAttribute("value", appConfig.color);
    		form.appendChild(f1);

    		var f2 = document.createElement("input");
    		f2.setAttribute("name", "rounds");
    		f2.setAttribute("type", "hidden");
    		f2.setAttribute("value", roundsbar.selectedIndex + 3);
    		form.appendChild(f2);

    		document.body.appendChild(form);
    		form.submit();
    	} 
    });

    button.onclick = function () {
    	socket.send("startgame$%*!" + appConfig.roomid);
    }

    botbox.onclick = function () {
        socket.send("botcheckbox$%*!" + appConfig.roomid);
    }
});
