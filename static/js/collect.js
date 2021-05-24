if(window.addEventListener) {
window.addEventListener('load', function () {
  var canvas, context, tool, word, isPaint = false;

  function getRandomWord()
  {
    var words = ['apple', 'house', 'banana'];

    var index = Math.floor(Math.random() * words.length);

    word = words[index];

    document.getElementById('word').innerHTML = "DRAW THIS: " + word;
  }

  function init () {
    // Find the canvas element.
    canvas = document.getElementById('canvas');

    if (!canvas) {
      alert('Error: I cannot find the canvas element!');
      return;
    }

    if (!canvas.getContext) {
      alert('Error: no canvas.getContext!');
      return;
    }

    // Get the 2D canvas context.
    context = canvas.getContext('2d');
    context.lineWidth = 5;

    if (!context) {
      alert('Error: failed to getContext!');
      return;
    }

    // Pencil tool instance.
    tool = new tool_pencil();

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup',   ev_canvas, false);

    context.save();

    context.globalCompositeOperation = 'destination-over';

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.restore();

    getRandomWord();

    var getPixelPos = function (x, y) {
      return (y * canvas.width + x) * 4;
    };

    var matchStartColor = function (data, pos, startColor) {
      return (data[pos]   === startColor.r &&
              data[pos+1] === startColor.g &&
              data[pos+2] === startColor.b &&
              data[pos+3] === startColor.a);
    };

    var colorPixel = function (data, pos, color) {
      data[pos] = color.r || 0;
      data[pos+1] = color.g || 0;
      data[pos+2] = color.b || 0;
      data[pos+3] = color.hasOwnProperty("a") ? color.a : 255;
    };

    // http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
    var floodFill = function (startX, startY, fillColor) {
      //var srcImg = ctx.getImageData(0,0,canvas.width,canvas.height);
      //var srcData = srcImg.data;
      var dstImg = context.getImageData(0,0,canvas.width,canvas.height);
      var dstData = dstImg.data;
      
      var startPos = getPixelPos(startX, startY);
      var startColor = {
        r: dstData[startPos],
        g: dstData[startPos+1],
        b: dstData[startPos+2],
        a: dstData[startPos+3]
      };
      var todo = [[startX,startY]];
      
      while (todo.length) {
        var pos = todo.pop();
        var x = pos[0];
        var y = pos[1];    
        var currentPos = getPixelPos(x, y);
        
        while((y-- >= 0) && matchStartColor(dstData, currentPos, startColor)) {
          currentPos -= canvas.width * 4;
        }
        
        currentPos += canvas.width * 4;
        ++y;
        var reachLeft = false;
        var reachRight = false;
        
        while((y++ < canvas.height-1) && matchStartColor(dstData, currentPos, startColor)) {

          colorPixel(dstData, currentPos, fillColor);
          
          if (x > 0) {
            if (matchStartColor(dstData, currentPos-4, startColor)) {
              if (!reachLeft) {
                todo.push([x-1, y]);
                reachLeft = true;
              }
            }
            else if (reachLeft) {
              reachLeft = false;
            }
          }
          
          if (x < canvas.width-1) {
            if (matchStartColor(dstData, currentPos+4, startColor)) {
              if (!reachRight) {
                todo.push([x+1, y]);
                reachRight = true;
              }
            }
            else if (reachRight) {
              reachRight = false;
            }
          }

          currentPos += canvas.width * 4;
        }
      }
      
      context.putImageData(dstImg,0,0);
    };

    canvas.onclick = function (e) {
      if (isPaint)
      {
        var startX = e.clientX - 10;
        var startY = e.clientY - 10;
        floodFill(startX, startY, context.strokeStyle);
      }
    };

  }

  // This painting tool works like a drawing pencil which tracks the mouse 
  // movements.
  function tool_pencil () {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
      if (!isPaint)
      {
        context.beginPath();
        context.moveTo(ev._x, ev._y);
        context.arc(ev._x, ev._y, context.lineWidth / 12, 0, 2 * Math.PI, true);
        tool.started = true;
        socket.send("paint$%*!" + appConfig.username + "$%*!" + ev._x + "$%*!" + ev._y);
      }
    };

    // This function is called every time you move the mouse. Obviously, it only 
    // draws if the tool.started state is set to true (when you are holding down 
    // the mouse button).
    this.mousemove = function (ev) {
      if (tool.started && !isPaint) {
        context.lineTo(ev._x, ev._y);
        socket.send("paint$%*!" + appConfig.username + "$%*!" + ev._x + "$%*!" + ev._y);
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started && !isPaint) {
        tool.mousemove(ev);
        tool.started = false;
      }
    };

    var socket = io.connect('http://127.0.0.1');
    socket.on('message', function(msg) {
      var res = msg.split("$%*!");
      if (res[0] == "paint" && res[1] != appConfig.username)
      { 
        alert(msg);
        context.beginPath();
        ev._x = res[2];
        ev._y = res[3];
        context.lineTo(ev._x, ev._y);
        context.stroke();
      } 
    });
  }

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  blue = document.getElementById('blue');
  red = document.getElementById('red');
  green = document.getElementById('green');
  yellow = document.getElementById('yellow');
  black = document.getElementById('black');
  white = document.getElementById('white');

  blue.onclick = function () {
      context.strokeStyle = "#0000ff";
      context.fillStyle = "#0000ff";
  }

  red.onclick = function () {
      context.strokeStyle = "#e62e00";
      context.fillStyle = "#e62e00";
  }

  green.onclick = function () {
      context.strokeStyle = "#009933";
      context.fillStyle = "#009933";
  }

  yellow.onclick = function () {
      context.strokeStyle = "#ffff00";
      context.fillStyle = "#ffff00";
  }

  black.onclick = function () {
      context.strokeStyle = "#000000";
      context.fillStyle = "#000000";
  }

  white.onclick = function () {
      context.strokeStyle = "#ffffff";
      context.fillStyle = "#ffffff";
  }

  small = document.getElementById('small');
  medium = document.getElementById('medium');
  big = document.getElementById('big');
  fill = document.getElementById('fill');
  clearbt = document.getElementById('clearbt');
  download = document.getElementById('download');

  small.onclick = function () {
    context.lineWidth = 2;
  }

  medium.onclick = function () {
    context.lineWidth = 5;
  }

  big.onclick = function () {
    context.lineWidth = 10;
  }

  fill.onclick = function () {
    if (!isPaint)
    {
      isPaint = true;
    }

    else
    {
      isPaint = false;
    }
  }

  clearbt.onclick = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();

    context.globalCompositeOperation = 'destination-over';

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.restore();
  }

  download.onclick = function () {
    var image = canvas.toDataURL();

    var socket = io.connect("http://" + appConfig.ip);
    socket.emit('photo',{data: word + "$%*!" + image});

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();

    context.globalCompositeOperation = 'destination-over';

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.restore();
    var i = 0;

    document.getElementById('word').innerHTML = "GOT IT!";

    setTimeout(function () {
      getRandomWord();
    }, 2000);

  }

  init();

}, false); }