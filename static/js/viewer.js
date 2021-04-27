if(window.addEventListener) {
    window.addEventListener('load', function () {

    // This function shows the paintings from drawer's side to viewers' side
    function getDrawing()
    {
      // Recognizes canvas element, defining canvas as 2D and default radius of painting
      var canvas = document.getElementById('canvas');
      var context = canvas.getContext('2d');
      context.lineWidth = 5;

      var socket = io.connect('http://' + appConfig.ip); // Connects to server through socket.io

      socket.emit("paint", { data: "viewerconnect$%*!" + appConfig.roomid + "$%*!" + appConfig.username} );

      socket.on('paint', function(msg) {
        alert(msg);
        var res = msg.split("$%*!"); // Gets message and splits it. Drawing messages are sent and recieved like that: 
                                     // 'paint$%*!{x_location}$%*!{y_location}$%*!{line_size}$%*!{line_color}'
        var x, y, size, color;
        if (res[2] == appConfig.roomid)
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
          }

          // Function that continues to paint on canvas
          if (res[0] == "paint")
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

          // Function that empty the canvas
          if (res[0] == "delete")
          {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      });
    }

    getDrawing();

}, false); }