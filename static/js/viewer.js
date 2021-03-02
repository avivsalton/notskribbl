if(window.addEventListener) {
    window.addEventListener('load', function () {

    // This function shows the paintings from drawer's side to viewers' side
    function getDrawing()
    {
      // Recognizes canvas element, defining canvas as 2D and default radius of painting
      var canvas = document.getElementById('canvas');
      context = canvas.getContext('2d');
      context.lineWidth = 5;

      var socket = io.connect('http://' appConfig.ip); // Connects to server through socket.io

      socket.on('message', function(msg) {

        var res = msg.split("$%*!"); // Gets message and splits it. Drawing messages are sent and recieved like that: 
                                     // 'paint$%*!{x_location}$%*!{y_location}$%*!{line_size}$%*!{line_color}'
        var x, y, size, color;

        // Function that starts painting on canvas
        if (res[0] == "startPaint")
        { 
          context.beginPath();
          x = parseInt(res[2]);
          y = parseInt(res[3]);
          size = parseInt(res[4]);
          color = res[5];
          context.lineWidth = size;
          context.strokeStyle = color;
          context.moveTo(x, y);
        }

        // Function that continues to paint on canvas
        if (res[0] == "paint")
        {
          x = parseInt(res[2]);
          y = parseInt(res[3]);
          size = parseInt(res[4]);
          color = res[5];
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
      });
    }

    getDrawing();

}, false); }