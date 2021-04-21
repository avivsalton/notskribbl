from flask import Flask, render_template, request, redirect, abort
from flask_socketio import SocketIO, send, emit
from actions import generate_id, dir_last_updated
import random
import operator

app = Flask(__name__)
username = ""
ip = "10.100.102.141"

colors = ['#0099cc', '#009933', '#cc0000', '#ff33cc', '#669999', '#cc9900']     # Colors generated for each user for chat
players = []    # Players for each room
rooms = []      # list of rooms and their privacy
viewers = []

public = { "id": "public", "admin": "none", "rounds": 100000, "isPrivate": False}
rooms.append(public)

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
    item = next((item for item in rooms if item["id"] == roomid), None)
    if not username:
        if request.method == "POST":
            if request.form.get("color") is not None:
                username = request.form.get("username")
                color = request.form.get("color")
                print(roomid, username, color)
                if item["admin"] == username:
                    return painting(username, color, roomid)
                return viewer(username, color, roomid)
            else:
                username = request.form.get("username")
                index = random.randint(0, 5)
                return rooms_site(roomid, index, username)
        else:
            return render_template("enteroom.html")
    else:
        if item["isPrivate"] == True:
            if item["admin"] == username:
                return render_template('room.html',username=username, color=colors[index], ip=ip, isRoomAdmin="True", roomid=roomid, rounds=0)
            else:
                return render_template('room.html',username=username, color=colors[index], ip=ip, isRoomAdmin="False", roomid=roomid, rounds=item["rounds"])
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
            curr_room = {"id" : id, "admin" : username, "rounds": 0, "isPrivate": True}
            rooms.append(curr_room)
            return redirect("http://" + ip + "/room/" + id, code=307)
        if username != "painter":
            return viewer(username, colors[index], "public")
        return painting(username, colors[index], "public")
    return render_template("signin.html")

# Returning the painting page
def painting(username, color, roomid):
    item = next((item for item in rooms if item["id"] == roomid), None)
    print("painting!")
    return render_template("painter.html", username=username, color=color, ip=ip, roomid=roomid, rounds=item["rounds"])

# Returning the viewer page
def viewer(username, color, roomid):
    item = next((item for item in rooms if item["id"] == roomid), None)
    print("viewing!")
    return render_template("viewer.html", username=username, color=color, ip=ip, roomid=roomid, rounds=item["rounds"])

# Sending messages through socket.io
@socketio.on('message')
def handleMessage(msg):
    if msg:
        print(msg)
        splited = msg.split("$%*!")
        if ("<script" in msg) or ("'<'" in msg and "script" in msg):
            ip_list.append(request.environ.get('REMOTE_ADDR'))
            return None
        if splited[0] == 'connect':
            user = next((user for user in players if user["username"] == splited[1]), None)
            user["sid"] = request.sid
            for p in players:
                if p["roomid"] == splited[2]:
                    send(splited[0] + "$%*!" + splited[1] + "$%*!" + splited[2], room=p["sid"])
            return None
        if splited[0] == 'roomconnect':
            index = random.randint(0, 5)
            curr_player = {"username": splited[1], "roomid": splited[2], "color": colors[index], "sid": request.sid}
            players.append(curr_player)
            for p in players:
                if p["roomid"] == splited[2]:
                    send('roomconnect$%*!' + splited[1] + '$%*!' + splited[2], room=p["sid"])
                    if p["sid"] != request.sid:
                        send('roomconnect$%*!' + p["username"] + '$%*!' + splited[2], room=request.sid)
            return None
        if splited[0] == 'changeroundbar':
            item = next((item for item in rooms if item["id"] == splited[1]), None)
            item["rounds"] = int(splited[2])
            for p in players:
                print(p["username"])
                if p["username"] != item["admin"]:
                    send("changeroundbar$%*!" + splited[1] + "$%*!" + splited[2], room=p["sid"])
            return None
        if splited[0] == 'startgame':
            for p in players:
                if p["roomid"] == splited[1]:
                    send(msg, room=p["sid"])
            return None


        for p in players:
            if p["roomid"] == splited[2]:
                print(p["sid"])
                send(msg, room=p["sid"])

@socketio.on('paint')
def sendPaint(json):
    msg = json["data"]
    if msg:
        splited = msg.split("$%*!")

        if splited[0] == 'startPaint':
            for p in players:
                if p["roomid"] == splited[2]:
                    send(msg, room=p["sid"])

        if splited[0] == 'paint':
            for p in viewers:
                if p["roomid"] == splited[2] and p["username"] != splited[1]:
                    emit("paint", msg, room=p["sid"])
            return None

        if splited[0] == 'viewerconnect':
            viewer = { "username" : splited[2], "roomid" : splited[1], "sid" : request.sid }
            viewers.append(viewer)
            return None



if __name__ == "__main__":
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    socketio.run(app, port=80, host="0.0.0.0")