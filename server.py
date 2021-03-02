from flask import Flask, render_template, request
from flask_socketio import SocketIO, send
import random


app = Flask(__name__)
username = ""
colors = ['#0099cc', '#009933', '#cc0000', '#ff33cc', '#669999', '#cc9900']
app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app, cors_allowed_origins='*')

@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == "POST":
        username = request.form.get("username")
        index = random.randint(0, 5)
        if username == "viewer":
            return viewer(username, index)
        return home(username, index)
    return render_template("signin.html")

def home(username, index):
    return render_template("home.html", username=username, color=colors[index])

def viewer(username, index):
    return render_template("viewer.html", username=username, color=colors[index])

@socketio.on('message')
def handleMessage(msg):
    if msg:
        send(msg, broadcast=True)


if __name__ == "__main__":
    socketio.run(app, port=80)