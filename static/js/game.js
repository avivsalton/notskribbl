if(window.addEventListener) {
    window.addEventListener('load', function () {

    	var gDuration;
    	var words = ['banana', 'monkey', 'bibi', 'hamburger', 'peter griffin', 'apple', 'house', 'donald trump'];

    	function startTimer(duration, display) 
    	{

		    var timer = duration, minutes, seconds;
		    setInterval(function () {
		        minutes = parseInt(timer / 60, 10)
		        seconds = parseInt(timer % 60, 10);

		        minutes = minutes < 10 ? "0" + minutes : minutes;
		        seconds = seconds < 10 ? "0" + seconds : seconds;

		        display.innerHTML = minutes + ":" + seconds;

		        if (--timer < 0) {
		            timer = duration;
		        }

		        if (duration == 0)
		        {
		        	return null;
		        }

		        duration--;

		    }, 1000);

		}


		function revealWord(word, display, isPainting) 
		{
			var original = word;
			var wordLength = word.length;

			if (isPainting)
			{
				display.innerHTML = word;
				return null;
			}

			display.innerHTML = "";

			for (i = 0; i < wordLength; i++) {
				if (original.charAt(i) == " ")
				{
					display.innerHTML = display.innerHTML + "&nbsp;&nbsp;";
				}
				else
				{
					display.innerHTML = display.innerHTML + "_ ";
				}
			}

			var taken = [];
			var x = 0;

			setInterval(function() { 
				if (x < word.length / 3 && duration > 0)
				{
					var index = Math.floor(Math.random() * wordLength);
					if (!taken.includes(index))
					{
						taken.push(index);
						x++;
					}

					display.innerHTML = "";

					for (i = 0; i < wordLength; i++) {
						if (taken.includes(i)){
							display.innerHTML = display.innerHTML + original.charAt(i);
						}

						else
						{
							if (original.charAt(i) == " ")
							{
								display.innerHTML = display.innerHTML + "&nbsp;&nbsp;";
							}
							else
							{
								display.innerHTML = display.innerHTML + "_ ";
							}
						}
				}
			} }, (gDuration / 3) * 1000);
		}

		function selectWords()
		{
			var chosen = [];
			for(i = 0; i < 3; i++)
			{
				var index = Math.floor(Math.random() * words.length);
				if (!chosen.includes(index))
				{
					chosen.push(index);
				}
				else
				{
					i--;
				}
			}

			var msg = "Choose one word: ";
			$("#canvasC").append("<div class='optionChooser' id='optns'><div class='msg'>" + msg + "</div><button id='option1' value='" + words[chosen[0]] + "'>" + words[chosen[0]] + "</button>" +
				"<button id='option2' value='" + words[chosen[1]] + "'>" + words[chosen[1]] + "</button><button id='option3' value='" + words[chosen[2]] + "'>" + words[chosen[2]] + "</button></div>");
		}

		function startGame(value, isPainting)
		{
			var duration = 60 * 1.5;
			gDuration = duration;
			timer = document.getElementById('timer');
			startTimer(duration, timer);

			var word = value;
			revealWord(word, document.getElementById('word'), isPainting);

			document.getElementById('optns').style.visibility = "hidden";
		}


		var socket = io.connect('http://' + appConfig.ip);

		socket.emit('game', {data : "gameconnect$%*!" + appConfig.roomid + "$%*!" + appConfig.username} );

		socket.on('game', function(msg) {
			alert(msg);
			var res = msg.split("$%*!");
			var isStarting = false;

			if (res[0] == "start")
			{
				startGame(res[3], false);
			}

			if (res[0] == "choose" && res[1] == appConfig.username)
			{
				isStarting = true;
			}

			if (isStarting == true)
			{
				selectWords();

				var option1 = document.getElementById('option1');
				var option2 = document.getElementById('option2');
				var option3 = document.getElementById('option3');

				option1.onclick = function () { startGame(option1.value, true); socket.emit('game', {data : "start$%*!" + appConfig.roomid + "$%*!" + appConfig.username + "$%*!" + option1.value} );}
				option2.onclick = function () { startGame(option2.value, true); socket.emit('game', {data : "start$%*!" + appConfig.roomid + "$%*!" + appConfig.username + "$%*!" + option2.value} );}
				option3.onclick = function () { startGame(option3.value, true); socket.emit('game', {data : "start$%*!" + appConfig.roomid + "$%*!" + appConfig.username + "$%*!" + option3.value} );}
			}

			else
			{
				var msg = res[1] + " is choosing a word";
				$("#canvasC").append("<div class='optionChooser' id='optns'><div class='msg'>" + msg + "</div></div>");
			}
		});

}, false); }