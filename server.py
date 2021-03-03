from flask import Flask, render_template, request, redirect, abort
from flask_socketio import SocketIO, send
from actions import generate_id
import random


app = Flask(__name__)
username = ""
ip = "10.100.102.200"

colors = ['#0099cc', '#009933', '#cc0000', '#ff33cc', '#669999', '#cc9900']     # Colors generated for each user for chat
players = []    # Players for each room
rooms = []      # list of rooms and their privacy
room_admins = [] # list of admins for rooms

app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app)

ip_list = []

@app.before_request
def block_method():
    ip = request.environ.get('REMOTE_ADDR')
    if ip in ip_list:
        abort(403)

# Connecting to every room
@app.route('/room/<roomid>', methods=['GET', 'POST'])
def rooms_site(roomid, username):
    if (roomid, "private") in rooms:
        if (roomid, username) in room_admins:
            return render_template('room.html',username=username, isRoomAdmin="True")
        else:
            return render_template('room.html',username=username, isRoomAdmin="False")
        return "welcome to room: " + roomid
    else:
        return "sorry this room does not exist"

# Home page function
@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == "POST":
        username = request.form.get("username")
        if ("<script" in username) or ("'<'" in username and "script" in username):
            ip_list.append(request.environ.get('REMOTE_ADDR'))
            return none
        type = request.form.get("submit")
        index = random.randint(0, 5)
        players.append(username)
        if type == "Create a Room":
            id = generate_id(rooms)
            rooms.append((id, "private"))
            room_admins.append((id, username))
            return rooms_site(id, username)
        if username != "aviv":
            return viewer(username, index)
        return home(username, index)
    return render_template("signin.html")

# Returning the painting page
def home(username, index):
    return render_template("home.html", username=username, color=colors[index], ip=ip)

# Returning the viewer page
def viewer(username, index):
    return render_template("viewer.html", username=username, color=colors[index], ip=ip)

# Sending messages through socket.io
@socketio.on('message')
def handleMessage(msg):
    if msg:
        print(msg)
        splited = msg.split("$%*!")
        if ("<script" in msg) or ("'<'" in msg and "script" in msg):
            ip_list.append(request.environ.get('REMOTE_ADDR'))
            return none
        if splited[0] == 'connect':
            for player in players:
                send("connected$%*!" + player)
        send(msg, broadcast=True)


if __name__ == "__main__":
    socketio.run(app, port=80, host="0.0.0.0")