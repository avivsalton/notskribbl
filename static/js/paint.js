if(window.addEventListener) {
window.addEventListener('load', function () {
  var canvas, context, tool;

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
  }

  // This painting tool works like a drawing pencil which tracks the mouse 
  // movements.
  function tool_pencil () {
    var tool = this;
    this.started = false;
    var socket = io.connect('http://127.0.0.1'); // Connecting to server through socket.io

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
        context.beginPath();
        context.moveTo(ev._x, ev._y);
        context.arc(ev._x, ev._y, context.lineWidth / 12, 0, 2 * Math.PI, true);
        tool.started = true;
        socket.send("startPaint$%*!" + appConfig.username + "$%*!" + ev._x + "$%*!" + ev._y + "$%*!" + context.lineWidth + "$%*!" + context.strokeStyle); // Sending to the server to start painting on viewers' side 
    };

    // This function is called every time you move the mouse. Obviously, it only 
    // draws if the tool.started state is set to true (when you are holding down 
    // the mouse button).
    this.mousemove = function (ev) {
      if (tool.started) {
        context.lineTo(ev._x, ev._y);
        socket.send("paint$%*!" + appConfig.username + "$%*!" + ev._x + "$%*!" + ev._y); // Sending to the server to continue painting on viewers' side 
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
      }
    };
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

  // Defining all of the coloring buttons
  // ---TODO---: Add more color options
  blue = document.getElementById('blue');
  red = document.getElementById('red');
  green = document.getElementById('green');
  yellow = document.getElementById('yellow');
  black = document.getElementById('black');
  white = document.getElementById('white');

  // Making functions for each button to change color
  blue.onclick = function () {
    	context.strokeStyle = "#0000ff";
  }

  red.onclick = function () {
    	context.strokeStyle = "#e62e00";
  }

  green.onclick = function () {
    	context.strokeStyle = "#009933";
  }

  yellow.onclick = function () {
    	context.strokeStyle = "#ffff00";
  }

  black.onclick = function () {
    	context.strokeStyle = "#000000";
  }

  white.onclick = function () {
    	context.strokeStyle = "#ffffff";
  }

  // Defining the tools buttons
  small = document.getElementById('small');
  medium = document.getElementById('medium');
  big = document.getElementById('big');
  clearbt = document.getElementById('clearbt');
  download = document.getElementById('download');

  // Defining the actions for the tools buttons
  small.onclick = function () {
  	context.lineWidth = 2;
  }

  medium.onclick = function () {
  	context.lineWidth = 5;
  }

  big.onclick = function () {
  	context.lineWidth = 10;
  }

  // Clearing the canvas
  clearbt.onclick = function () {
  	context.clearRect(0, 0, canvas.width, canvas.height);
    var socket = io.connect('http://127.0.0.1');
    socket.send("delete$%*!"); // Sending to server that the board has been cleared
  }

  // ---FIX---: Saving the paintings in canvas as an image
  download.onclick = function () {
  	alert('okay');
  	canvas.src = canvas.toDataURL();
    Canvas2Image.saveAsPNG(canvas);
  }

  init();

}, false); }
