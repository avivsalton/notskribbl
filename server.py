from flask import Flask, render_template, request, redirect, abort
from flask_socketio import SocketIO, send
from actions import generate_id
import random
import operator

app = Flask(__name__)
username = ""
ip = "10.100.102.33"

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
def rooms_site(roomid, index=0, username=''):
    if not username:
        if request.method == "POST":
            username = request.form.get("username")
            index = random.randint(0, 5)
            return rooms_site(roomid, index, username)
        else:
            return render_template("enteroom.html")
    else:
        if (roomid, "private") in rooms:
            players.append((username, roomid))
            if (roomid, username) in room_admins:
                return render_template('room.html',username=username, color=colors[index], ip=ip, isRoomAdmin="True", roomid=roomid)
            else:
                return render_template('room.html',username=username, color=colors[index], ip=ip, isRoomAdmin="False", roomid=roomid)
        else:
            return "sorry this room does not exist"

# Home page function
@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == "POST":
        username = request.form.get("username")
        if ("<script" in username) or ("'<'" in username and "script" in username):
            ip_list.append(request.environ.get('REMOTE_ADDR'))
            return None
        type = request.form.get("submit")
        index = random.randint(0, 5)
        if type == "Create a Room":
            id = generate_id(rooms)
            rooms.append((id, "private"))
            room_admins.append((id, username))
            return redirect("http://" + ip + "/room/" + id, code=307)
        players.append((username, "public"))
        if username != "painter":
            return viewer(username, index)
        return painting(username, index)
    return render_template("signin.html")

# Returning the painting page
def painting(username, index):
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
        sid = request.sid
        if ("<script" in msg) or ("'<'" in msg and "script" in msg):
            ip_list.append(request.environ.get('REMOTE_ADDR'))
            return None
        if splited[0] == 'connect':
            send(splited[0] + "$%*!" + splited[1] + "$%*!" + splited[2], broadcast=True)
            return None
        if splited[0] == 'roomconnect':
            for username, roomid in players:
                if roomid == splited[2] and username != splited[1]:
                    send('roomconnect$%*!' + username + '$%*!' + roomid, room=sid)
                    print("sent!")
        if splited[0] == 'changeroundbar':
            send("changeroundbar$%*!" + splited[1] + "$%*!" + splited[2], broadcast=True)
        if splited[0] == "startgame":
            send(msg, broadcast=True)
        send(msg, broadcast=True)



if __name__ == "__main__":
    socketio.run(app, port=80, host="0.0.0.0")