if(window.addEventListener) {
    window.addEventListener('load', function () {

    	var gDuration;

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


		function revealWord(word, display) 
		{
			var original = word;
			var wordLength = word.length;
			display.innerHTML = "";

			for (i = 0; i < wordLength; i++) {
				display.innerHTML = display.innerHTML + "_ ";
			}

			var taken = [];
			var x = 0;

			setInterval(function() { 
				if (x < word.length / 2)
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
							display.innerHTML = display.innerHTML + "_ ";
						}
				}
			} }, (gDuration / 3) * 1000);
		}

		var duration = 60 * 1.5;
		gDuration = duration;
		timer = document.getElementById('timer');
		startTimer(duration, timer);

		var word = document.getElementById('word');
		revealWord(word.innerHTML, word);

}, false); }