var isDone = false;
var word = "";
var hasStarted = false;
var gDuration = 0;
var botFound = false;
var opts = "";
var reveal = "";
var option1 = "";
var option2 = "";
var option3 = "";
var roundcount = 1;
var socket = io.connect('http://' + appConfig.ip);
var haveAllGuesed = false;

if(window.addEventListener) {

    window.addEventListener('load', function () {

    	var words = ['Ant', 'Apple', 'Banana', 'Guitar', 'Hourglass', 'House'];

    	function setToolbarVisibility(display)
    	{
    		if (appConfig.painting == "True")
			{
				document.getElementById('tools').style.visibility = "visible";
			}
			else
			{
				document.getElementById('tools').style.visibility = "hidden";
			}
    	}

    	function startTimer(duration, display) 
    	{
		    var timer = duration, minutes, seconds;
		    var intervalId =  setInterval(function () {
                                    minutes = parseInt(timer / 60, 10)
                                    seconds = parseInt(timer % 60, 10);

                                    minutes = minutes < 10 ? "0" + minutes : minutes;
                                    seconds = seconds < 10 ? "0" + seconds : seconds;

                                    display.innerHTML = minutes + ":" + seconds;

                                    if (--timer < 0) {
                                        timer = duration;
                                    }

                                    if (duration == 0 || isDone == true)
                                    {
                                        duration = 0;
                                        display.innerHTML = "00:00";
                                        if (appConfig.painting == "True" && duration == 0 && haveAllGuesed == false)
                                        {
                                            socket.emit('game', {data: "endGame$%*!" + appConfig.roomid});
                                        }
                                        clearInterval(intervalId);
                                    }

                                    duration--;
                                    gDuration = duration;

                                }, 1000);

		}


		function revealWord(word, display, isPainting) 
		{
			var original = word;
			var wordLength = word.length;

			if (isPainting == "True")
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

			var intervalId = setInterval(function() {
                                            if (x < word.length / 3 && gDuration > 0)
                                            {
                                                if (isDone == true)
                                                {
                                                    clearInterval(intervalId);
                                                    return null;
                                                }

                                                var index = Math.floor(Math.random() * wordLength);

                                                while (taken.includes(index))
                                                {
                                                    index = Math.floor(Math.random() * wordLength);
                                                }

                                                taken.push(index);

                                                x++;

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
                                            }
                                        }, 25000);
            setInterval(function() {
                if (isDone == true)
                {
                    clearInterval(intervalId);
                    return null;
                }

            }, 1000);
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

            opts = Math.floor(Math.random() * 999999) + 100000;
			while (opts.toString(10).localeCompare(reveal.toString(10)) == 0){
			    opts = toString(Math.floor(Math.random() * 999999) + 100000);
			}

			option1 = Math.floor(Math.random() * 999999) + 100000;
            option2 = Math.floor(Math.random() * 999999) + 100000;
            option3 = Math.floor(Math.random() * 999999) + 100000;

			while (option1.toString(10).localeCompare(option2.toString(10)) == 0 || option2.toString(10).localeCompare(option3.toString(10)) == 0 || option1.toString(10).localeCompare(option3.toString(10)) == 0){
			    option1 = toString(Math.floor(Math.random() * 999999) + 100000);
                option2 = toString(Math.floor(Math.random() * 999999) + 100000);
                option3 = toString(Math.floor(Math.random() * 999999) + 100000);
			}

			$("#canvasC").append("<div class='optionChooser' id='" + opts + "'><div class='msg'>" + msg + "</div><button id='" + option1 + "' value='" + words[chosen[0]] + "'>" + words[chosen[0]] + "</button>" +
				"<button id='" + option2 + "' value='" + words[chosen[1]] + "'>" + words[chosen[1]] + "</button><button id='" + option3 + "' value='" + words[chosen[2]] + "'>" + words[chosen[2]] + "</button></div>");
		}

		function startGame(value, isPainting)
		{
		    haveAllGuesed = false;
			var duration = 90;
			gDuration = duration;
			timer = document.getElementById('timer');

			var word = value;
			document.getElementById(opts).style.visibility = "hidden";
			revealWord(word, document.getElementById('word'), isPainting);
			startTimer(duration, timer);

			if (appConfig.painting == "True")
			{
                painting();

                if (appConfig.bot == "True")
                {
                    var intervalId = setInterval(function () {
                                        if (botFound == false)
                                        {
                                            var image = document.getElementById('canvas').toDataURL();
                                            socket.emit('photo',{data: appConfig.roomid + "$%*!" + image});
                                        }
                                        else if (isDone == true || botFound == true || (isDone == true && botFound == true))
                                        {
                                            clearInterval(intervalId);
                                        }
                                    }, 4000);
                }
            }
            else
            {
                viewing();
			}
		}

		function showWordsWindow()
		{
            selectWords();

			var bt_option1 = document.getElementById(option1);
			var bt_option2 = document.getElementById(option2);
			var bt_option3 = document.getElementById(option3);

			bt_option1.onclick = function () { isDone = false; socket.emit('game', {data : "start$%*!" + appConfig.roomid + "$%*!" + appConfig.username + "$%*!" + bt_option1.value} ); word = bt_option1.value; startGame(bt_option1.value, appConfig.painting); }
			bt_option2.onclick = function () { isDone = false; socket.emit('game', {data : "start$%*!" + appConfig.roomid + "$%*!" + appConfig.username + "$%*!" + bt_option2.value} ); word = bt_option2.value; startGame(bt_option2.value, appConfig.painting); }
			bt_option3.onclick = function () { isDone = false; socket.emit('game', {data : "start$%*!" + appConfig.roomid + "$%*!" + appConfig.username + "$%*!" + bt_option3.value} ); word = bt_option3.value; startGame(bt_option3.value, appConfig.painting); }

			hasStarted = true;
		}

		function whoChoosesWord(username)
		{
		    var msg = username + " is choosing a word";

		    opts = Math.floor(Math.random() * 999999) + 100000;
			while (opts.toString(10).localeCompare(reveal.toString(10)) == 0){
			    opts = toString(Math.floor(Math.random() * 999999) + 100000);
			}

			$("#canvasC").append("<div class='optionChooser' id='" + opts + "'><div class='msg'>" + msg + "</div></div>");
			hasStarted = true;
		}

		setToolbarVisibility();

		socket.emit('game', {data : "gameconnect$%*!" + appConfig.roomid + "$%*!" + appConfig.username} );

		socket.on('game', function(msg) {
			var isStarting = false;

			var res = msg.split("$%*!");

            if (res[0] == "botFound")
            {
                botFound = true;
            }

			if (res[0] == "start")
			{
				startGame(res[3], appConfig.painting);
				word = res[3];
				isDone = false;
			}

			if (res[0] == "done")
			{
				isDone = true;
				botFound = false;

				if (res[3] == "True")
				{
				    haveAllGuesed = true;
				}
				else
				{
				    haveAllGuesed = false;
				}

                reveal = Math.floor(Math.random() * 999999) + 100000;
                while (opts.toString(10).localeCompare(reveal.toString(10)) == 0){
			        reveal = toString(Math.floor(Math.random() * 999999) + 100000);
			    }


				$("#canvasC").append("<div class='optionChooser' id='" + reveal + "'><div class='msg'>" + "The word was: " + word +  "</div></div>");

                setTimeout(function() {
                    document.getElementById(reveal).style.visibility = "hidden";

                    if (appConfig.painting == "True")
				    {
                        appConfig.painting = "False";
                        whoChoosesWord(res[2]);
                    }

                    else
                    {
                        if (res[2] == appConfig.username)
                        {
                            appConfig.painting = "True";
                            showWordsWindow();
                        }
                        else
                        {
                            whoChoosesWord(res[2]);
                        }
				    }

				    setToolbarVisibility();
				}, 2000);
			}

			if (res[0] == "doneGame")
			{
			    $("#canvasC").append("<div class='optionChooser' id='gameover'><div class='msg'>Game Over!</div></div>");
			}

			if (res[0] == "round")
			{
			    $("#canvasC").append("<div class='optionChooser' id='round" + roundcount.toString(10) + "'><div class='msg'>Round " + res[1] + "</div></div>");

			    setTimeout(function() {
			        var nameround = 'round' + roundcount.toString(10);
                    document.getElementById(nameround).style.visibility = "hidden";
                    roundcount = roundcount + 1;
				}, 2000);
			}

			if (res[0] == "choose" && res[1] == appConfig.username && isStarting == false)
			{
				isStarting = true;
			}

			if (isStarting == true && hasStarted == false)
			{
				showWordsWindow();
			}

			else if (isStarting == false && hasStarted == false)
			{
				whoChoosesWord(res[1]);
			}

		});

}, false); }