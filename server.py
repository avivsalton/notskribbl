from flask import Flask, render_template, request
from flask_socketio import SocketIO, send
from actions import generate_id
import random


app = Flask(__name__)
username = ""

colors = ['#0099cc', '#009933', '#cc0000', '#ff33cc', '#669999', '#cc9900']     # Colors generated for each user for chat
players = []    # Players for each room
rooms = []      # list of rooms and their privacy

app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app)

# Connecting to every room
@app.route('/room/<roomid>', methods=['GET', 'POST'])
def rooms_site(roomid):
    if (roomid, "private") in rooms:
        return "welcome to room: " + roomid
    else:
        return "sorry this room does not exist"

# Home page
@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == "POST":
        username = request.form.get("username")
        type = request.form.get("submit")
        print(type)
        index = random.randint(0, 5)
        players.append(username)
        if type == "Create a Room":
            id = generate_id(rooms)
            rooms.append((id, "private"))
            return id
        if username == "viewer":
            return viewer(username, index)
        return home(username, index)
    return render_template("signin.html")

# Returning the painting page
def home(username, index):
    return render_template("home.html", username=username, color=colors[index], ip='10.100.102.224')

# Returning the viewer page
def viewer(username, index):
    return render_template("viewer.html", username=username, color=colors[index], ip='10.100.102.224')

# Sending messages through socket.io
@socketio.on('message')
def handleMessage(msg):
    if msg:
        print(msg)
        splited = msg.split("$%*!")
        if splited[0] == 'connect':
            for player in players:
                send("connected$%*!" + player)
        send(msg, broadcast=True)


if __name__ == "__main__":
    socketio.run(app, port=80, host="0.0.0.0")