function painting()
{
    var isDone = false;

    if (isDone == false)
    var canvas, context, tool;

    var socket = io.connect('http://' + appConfig.ip); // Connecting to server through socket.io
    socket.emit("paint", {data : "admin$%*!" + appConfig.username + "$%*!" + appConfig.roomid});

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
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
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
      if (isDone == false)
      {
        var tool = this;
        this.started = false;

        // This is called when you start holding down the mouse button.
        // This starts the pencil drawing.
        this.mousedown = function (ev) {
            context.beginPath();
            context.arc(ev._x, ev._y, context.lineWidth / 12, 0, 2 * Math.PI);
            context.fillStyle = context.strokeStyle;
            context.stroke();
            context.fill();
            context.moveTo(ev._x, ev._y);
            tool.started = true;
            socket.emit("paint",{data: "startPaint$%*!" + appConfig.username + "$%*!" + appConfig.roomid + "$%*!" + ev._x + "$%*!" + ev._y + "$%*!" + context.lineWidth + "$%*!" + context.strokeStyle}); // Sending to the server to start painting on viewers' side
        };

        // This function is called every time you move the mouse. Obviously, it only
        // draws if the tool.started state is set to true (when you are holding down
        // the mouse button).
        this.mousemove = function (ev) {
          if (tool.started) {
            context.lineTo(ev._x, ev._y);
            socket.emit("paint",{ data: "paint$%*!" + appConfig.username + "$%*!" + appConfig.roomid + "$%*!" + ev._x + "$%*!" + ev._y + "$%*!" + context.lineWidth + "$%*!" + context.strokeStyle}); // Sending to the server to continue painting on viewers' side
            context.stroke();
          }
        };

        // This is called when you release the mouse button.
        this.mouseup = function (ev) {
          if (tool.started) {
            tool.mousemove(ev);
            socket.emit("paint",{ data: "mouseup$%*!" + appConfig.username + "$%*!" + appConfig.roomid + "$%*!" + ev._x + "$%*!" + ev._y + "$%*!" + context.lineWidth + "$%*!" + context.strokeStyle});
            tool.started = false;
          }
        };
      }
    }

    // The general-purpose event handler. This function just determines the mouse
    // position relative to the canvas element.
    function ev_canvas (ev) {
      if (isDone == false)
      {
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

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      socket.emit("paint",{data: "delete$%*!" + appConfig.username + "$%*!" + appConfig.roomid}); // Sending to server that the board has been cleared
    }

    socket.on('paint', function(msg) {
      var res = msg.split("$%*!"); // Gets message and splits it. Drawing messages are sent and recieved like that:
                                   // 'paint$%*!{x_location}$%*!{y_location}$%*!{line_size}$%*!{line_color}'
      if (res[2] == appConfig.roomid)
      {
        if (res[0] == "terminate")
        {
          context.clearRect(0, 0, canvas.width, canvas.height);
          viewing();
          isDone = true;
        }
      }
    });

    init();
}

function viewing()
{
      var isDone = false;
      // This function shows the paintings from drawer's side to viewers' side
      function getDrawing()
      {
        // Recognizes canvas element, defining canvas as 2D and default radius of painting
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        context.lineWidth = 5;
        var isDown = false;

        var socket = io.connect('http://' + appConfig.ip); // Connects to server through socket.io

        socket.emit("paint", { data: "viewerconnect$%*!" + appConfig.roomid + "$%*!" + appConfig.username} );

        socket.on('paint', function(msg) {
          var res = msg.split("$%*!"); // Gets message and splits it. Drawing messages are sent and recieved like that:
                                       // 'paint$%*!{x_location}$%*!{y_location}$%*!{line_size}$%*!{line_color}'
          var x, y, size, color;
          if (res[2] == appConfig.roomid && isDone == false)
          {
            // Function that starts painting on canvas
            if (res[0] == "startPaint")
            {
              context.beginPath();
              x = parseInt(res[3]);
              y = parseInt(res[4]);
              size = parseInt(res[5]);
              color = res[6];
              context.lineWidth = size;
              context.strokeStyle = color;
              context.arc(x, y, context.lineWidth / 12, 0, 2 * Math.PI);
              context.fillStyle = context.strokeStyle;
              context.stroke();
              context.fill();
              context.moveTo(x, y);
              isDown = true;
            }

            // Function that continues to paint on canvas
            if (res[0] == "paint")
            {
              if (isDown == true)
              {
                x = parseInt(res[3]);
                y = parseInt(res[4]);
                size = parseInt(res[5]);
                color = res[6];
                context.lineWidth = size;
                context.strokeStyle = color;
                context.lineTo(x, y);
                context.stroke();
              }
            }

            if (res[0] == "mouseup")
            {
              isDown = false;
            }

            // Function that empty the canvas
            if (res[0] == "delete")
            {
              context.clearRect(0, 0, canvas.width, canvas.height);
            }

            if (res[0] == "terminate")
            {
              context.clearRect(0, 0, canvas.width, canvas.height);
              painting();
              isDone = true;
            }
          }
        });
      }

      getDrawing();
}
