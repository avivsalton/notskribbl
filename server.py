from flask import Flask, render_template, request, redirect, abort
from flask_socketio import SocketIO, send, emit
from actions import generate_id, startTimer, getRandomColor, getPrediction, getRandomNumber, calculateScore
import random
import urllib
from PIL import Image
import threading

app = Flask(__name__)
username = ""
ip = "10.100.102.106"

players = []    # Players for each room
rooms = []      # list of rooms and their privacy
viewers = []
gamesid = []
adminsid = []
drawers = []

public = { "id": "public", "admin": "none", "rounds": 100000, "isPrivate": False}
rooms.append(public)

app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app, async_mode='eventlet')

ip_list = []

@app.before_request
def block_method():
    ip = request.environ.get('REMOTE_ADDR')
    if ip in ip_list:
        abort(403)

# Connecting to every room
@app.route('/room/<roomid>', methods=['GET', 'POST'])
def rooms_site(roomid, color='', username=''):
    item = next((item for item in rooms if item["id"] == roomid), None)
    if not username and not color:
        if request.method == "POST":
            if request.form.get("color") is not None:
                username = request.form.get("username")
                color = request.form.get("color")
                rounds = request.form.get("rounds")
                item["rounds"] = int(rounds)

                if item["admin"] == username:
                    return painting(username, color, roomid)
                return viewer(username, color, roomid)

            else:
                username = request.form.get("username")
                item["count"] = item["count"] + 1
                item["guessing"] = item["guessing"] + 1
                return rooms_site(roomid, getRandomColor(), username)
        else:
            return render_template("enteroom.html")
    else:
        if item["isPrivate"] == True:
            if item["admin"] == username:
                return render_template('room.html',username=username, color=color, ip=ip, isRoomAdmin="True", roomid=roomid, rounds=0)
            else:
                return render_template('room.html',username=username, color=color, ip=ip, isRoomAdmin="False", roomid=roomid, rounds=item["rounds"])
        else:
            return "sorry this room does not exist"

# Home page function
@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == "POST":
        username = request.form.get("username") # getting the username from the form action

        # filter for words that will crash website
        if ("<script" in username) or ("'<'" in username and "script" in username):
            ip_list.append(request.environ.get('REMOTE_ADDR')) # adds ip to list of banned ips
            return None

        # gets the submit button's value
        type = request.form.get("submit")

        if type == "Create a Room": # create a room if that button was pressed
            id = generate_id(rooms)
            curr_room = {"id" : id, "admin" : username, "rounds": 0, "count": 0, "guessing": -1, "currentWord": "", "isPrivate": True, "botMode": False, "duaration": 90}
            curr_list = {"list" : [], "id": id, "index": 0, "current_round": 1, "drawer_sid": ""}
            rooms.append(curr_room)
            drawers.append(curr_list)
            return redirect("http://" + ip + "/room/" + id, code=307)

        if username != "painter": # goes to public room if the other button was pressed
            return viewer(username, getRandomColor(), "public")
        return painting(username, getRandomColor(), "public")
    return render_template("signin.html")

# Returning the painting page
def painting(username, color, roomid):
    item = next((item for item in rooms if item["id"] == roomid), None)
    print("bot: " + str(item["botMode"]))
    if item["botMode"] == True:
        curr_player = {"username": "Bot", "roomid": item["id"], "color": getRandomColor(), "sid": "None", "points": 0}
        item["guessing"] = item["guessing"] + 1
        players.append(curr_player)
    return render_template("painter.html", username=username, color=color, ip=ip, roomid=roomid, rounds=item["rounds"], isPainting = "True", botMode = item["botMode"])

# Returning the viewer page
def viewer(username, color, roomid):
    item = next((item for item in rooms if item["id"] == roomid), None)
    return render_template("painter.html", username=username, color=color, ip=ip, roomid=roomid, rounds=item["rounds"], isPainting = "False", botMode = item["botMode"])

# Sending messages through socket.io
@socketio.on('message')
def handleMessage(msg):
    print(msg)
    if msg:
        splited = msg.split("$%*!")
        if ("<script" in msg) or ("'<'" in msg and "script" in msg):
            ip_list.append(request.environ.get('REMOTE_ADDR'))
            return None

        if splited[0] == "requestPlayers":
            for p in players:
                if p["roomid"] == splited[1]:
                    send("connect$%*!" + p["username"] + "$%*!" + splited[1], room=request.sid)
                    print("sent!: " + splited[2])

            player = next((player for player in players if player["username"] == splited[2]), None)
            player["sid"] = request.sid

            return None

        if splited[0] == 'roomconnect':
            index = random.randint(0, 5)
            curr_player = {"username": splited[1], "roomid": splited[2], "color": getRandomColor(), "sid": request.sid, "points": 0}
            players.append(curr_player)
            item = next((item for item in drawers if item["id"] == splited[2]), None)
            item["list"].append(splited[1])
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
                if p["username"] != item["admin"]:
                    send("changeroundbar$%*!" + splited[1] + "$%*!" + splited[2], room=p["sid"])
            return None

        if splited[0] == 'botcheckbox':
            item = next((item for item in rooms if item["id"] == splited[1]), None)
            if item["botMode"] == False:
                item["botMode"] = True
            else:
                item["botMode"] = False

            for p in players:
                if p["username"] != item["admin"]:
                    send("botcheckbox$%*!" + splited[1], room=p["sid"])
            return None

        if splited[0] == 'startgame':
            for p in players:
                if p["roomid"] == splited[1]:
                    send(msg, room=p["sid"])
            return None

        if splited[0] == 'message':
            item = next((item for item in rooms if item["id"] == splited[2]), None)
            player = next((player for player in players if player["username"] == splited[1]), None)
            drawer = next((drawer for drawer in drawers if drawer["id"] == splited[2]), None)
            if splited[4] == item["currentWord"] and splited[1] != drawer["list"][drawer["index"]]:
                curr_points = calculateScore(item["duaration"])
                player["points"] = player["points"] + curr_points
                for p in players:
                    if p["roomid"] == splited[2]:
                        send("found$%*!" + splited[1] + "$%*!" + splited[2] + "$%*!" + str(player["points"]), room=p["sid"])
                item["guessing"] = item["guessing"] - 1

                if item["guessing"] == 0:
                    curr_drawer = None
                    print(item["rounds"], drawer["current_round"])
                    if drawer["index"] == item["count"] - 1:
                        drawer["index"] = 0
                        if drawer["current_round"] == item["rounds"]:
                            for g in gamesid:
                                if g["roomid"] == splited[2]:
                                    emit("game", "doneGame$%*!" + splited[2], room=g["sid"])
                            return None

                        drawer["current_round"] = drawer["current_round"] + 1

                        for g in gamesid:
                            if g["roomid"] == splited[2]:
                                emit("game", "round$%*!" + str(drawer["current_round"]), room=g["sid"])
                    else:
                        drawer["index"] = drawer["index"] + 1
                        curr_drawer = drawer["list"][drawer["index"]]

                    curr_drawer = drawer["list"][drawer["index"]]
                    for g in gamesid:
                        if g["roomid"] == splited[2]:
                            emit("game", "done$%*!" + splited[2] + "$%*!" + curr_drawer + "$%*!True", room=g["sid"])
                            print("sent!")

                    for p in viewers:
                        if p["roomid"] == splited[2]:
                            send("visible$%*!" + splited[2], room=p["sid"])
                            emit("paint", "terminate$%*!" + splited[1] + "$%*!" + splited[2], room=p["sid"])
                            print("sent terminate!")

                    emit("paint", "terminate$%*!" + splited[1] + "$%*!" + splited[2], room=drawer["drawer_sid"])
                    print("sent terminate!")

                    bot = next((bot for bot in players if bot["username"] == "Bot"), None)

                    if bot is None:
                        item["guessing"] = item["count"] - 1
                    else:
                        item["guessing"] = item["count"]

                    item["duaration"] = 0

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
            for p in viewers:
                if p["roomid"] == splited[2]:
                    emit("paint", msg, room=p["sid"])

            return None

        if splited[0] == 'paint':
            for p in viewers:
                if p["roomid"] == splited[2] and p["username"] != splited[1]:
                    emit("paint", msg, room=p["sid"])
            return None

        if splited[0] == 'viewerconnect':
            viewer = { "username" : splited[2], "roomid" : splited[1], "sid" : request.sid }
            viewers.append(viewer)
            return None

        if splited[0] == 'delete':
            for p in viewers:
                if p["roomid"] == splited[2] and p["username"] != splited[1]:
                    emit("paint", msg, room=p["sid"])
            return None

        if splited[0] == 'mouseup':
            for p in viewers:
                if p["roomid"] == splited[2]:
                    emit("paint", msg, room=p["sid"])

        if splited[0] == 'admin':
            drawer = next((drawer for drawer in drawers if drawer["id"] == splited[2]), None)
            drawer["drawer_sid"] = request.sid


@socketio.on('game')
def sendPaint(json):
    msg = json["data"]
    print(msg)
    if msg:
        splited = msg.split("$%*!")

        if splited[0] == 'gameconnect':
            gamer = { "username" : splited[2], "roomid" : splited[1], "sid" : request.sid }
            gamesid.append(gamer)

            count = 0
            for g in gamesid:
                count = count + 1

            item = next((item for item in rooms if item["id"] == splited[1]), None)
            bot = next((bot for bot in players if bot["username"] == "Bot"), None)
            if (count == item["count"]) or (count - 1 == item["count"] and bot is not None):
                user = item["admin"]
                for g in gamesid:
                    if g["roomid"] == splited[1]:
                        emit("game", "choose$%*!" + user, room=g["sid"])
                        emit("game", "round$%*!1", room=g["sid"])
            return None

        if splited[0] == "start":
            item = next((item for item in rooms if item["id"] == splited[1]), None)
            item["currentWord"] = splited[3]
            for g in gamesid:
                if g["roomid"] == splited[1] and g["sid"] != request.sid:
                    emit("game", msg, room=g["sid"])

            item["duaration"] = 90
            t = threading.Thread(target=startTimer, args=[item, item["id"], splited[2], drawers, gamesid, viewers])
            t.start()
            return None

        if splited[0] == "endGame":
            drawer = next((drawer for drawer in drawers if drawer["id"] == splited[1]), None)
            item = next((item for item in rooms if item["id"] == splited[1]), None)

            curr_drawer = None
            print(item["rounds"], drawer["current_round"])
            if drawer["index"] == item["count"] - 1:
                drawer["index"] = 0
                if drawer["current_round"] == item["rounds"]:
                    for g in gamesid:
                        if g["roomid"] == splited[1]:
                            emit("game", "doneGame$%*!" + splited[1], room=g["sid"])
                    return None

                drawer["current_round"] = drawer["current_round"] + 1

                for g in gamesid:
                    if g["roomid"] == splited[1]:
                        emit("game", "round$%*!" + str(drawer["current_round"]), room=g["sid"])
            else:
                drawer["index"] = drawer["index"] + 1
                curr_drawer = drawer["list"][drawer["index"]]

            curr_drawer = drawer["list"][drawer["index"]]
            for g in gamesid:
                if g["roomid"] == splited[1]:
                    emit("game", "done$%*!" + splited[1] + "$%*!" + curr_drawer + "$%*!False", room=g["sid"])

            for p in viewers:
                if p["roomid"] == splited[1]:
                    send("visible$%*!" + splited[1], room=p["roomid"])
                    emit("paint", "terminate$%*!" + p["username"] + "$%*!" + splited[1], room=p["sid"])
                    print("sent terminate!")

            emit("paint", "terminate$%*!" + username + "$%*!" + splited[1], room=drawer["id"])

            bot = next((bot for bot in players if bot["username"] == "Bot"), None)

            if bot is None:
                item["guessing"] = item["count"] - 1
            else:
                item["guessing"] = item["count"]

            item["duaration"] = 0

@socketio.on('photo')
def savePhoto(json):
    msg = json['data']
    split = msg.split("$%*!")
    item = next((item for item in rooms if item["id"] == split[0]), None)
    if item["botMode"] == True:
        name = str(getRandomNumber()) + ".jpg"
        response = urllib.request.urlopen(split[1])
        directory = "test\\" + name
        with open(directory, 'wb') as f:
            f.write(response.file.read())
        size = 28, 28
        im = Image.open(directory)
        im_resized = im.resize(size, Image.ANTIALIAS)
        im_resized.save(directory, "PNG")
        name = getPrediction(directory)
        print(name)
        if name == item["currentWord"]:
            player = next((player for player in players if player["username"] == "Bot"), None)
            curr_points = calculateScore(item["duaration"])
            player["points"] = player["points"] + curr_points
            for p in players:
                if p["roomid"] == split[0]:
                    send("found$%*!Bot" + "$%*!" + split[0] + "$%*!" + str(player["points"]), room=p["sid"])
            for g in gamesid:
                if g["roomid"] == split[0]:
                    print("sent to: " + g["sid"])
                    emit("game", "botFound", room=g["sid"])

            item["guessing"] = item["guessing"] - 1

            return None

        for p in players:
            if p["roomid"] == split[0]:
                if p["sid"] is not None:
                    send("message$%*!Bot$%*!" + split[0] + "$%*!" + p["color"] + "$%*!" + name, room=p["sid"])




if __name__ == "__main__":
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    socketio.run(app, port=80, host="0.0.0.0", debug=True)