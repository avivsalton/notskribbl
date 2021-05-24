import random
import os
import tensorflow as tf
import time
import numpy as np
from PIL import Image, ImageOps
from flask_socketio import send, emit

def generate_id(list):
    str = ""
    while 1:
        for x in range(12):
            group = random.randint(0,1)
            if group == 0:
                num = random.randint(0, 25)
                str = str + chr(97 + num)
            if group == 1:
                num = random.randint(0, 25)
                str = str + chr(65 + num)
        if str not in list:
            return str

def dir_last_updated(folder):
    return str(max(os.path.getmtime(os.path.join(root_path, f))
                   for root_path, dirs, files in os.walk(folder)
                   for f in files))

def getRandomNumber():
    return random.randint(1000,9999)

def getRandomColor():
    colors = ['#0099cc', '#009933', '#cc0000', '#ff33cc', '#669999',
              '#cc9900']  # Colors generated for each user for chat
    index = random.randint(0, 5)
    return colors[index]

def getPrediction(path):
    model = tf.keras.models.load_model('models/paintings_v3.0')

    class_names = ["Ant", "Apple", "Banana", "Guitar", "Hourglass", "House"]

    img_height = 28
    img_wroom_idth = 28

    img = Image.open(path).convert('L')
    img = ImageOps.invert(img)
    img.save(path)

    img = tf.keras.preprocessing.image.load_img(
        path, target_size=(img_height, img_wroom_idth)
    )



    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0) # Create a batch

    predictions = model.predict(img_array)
    score = tf.nn.softmax(predictions[0])

    return class_names[np.argmax(score)]

def calculateScore(duaration):
    if duaration < 30:
        return duaration * 2
    if duaration < 60:
        return duaration * 3
    return duaration * 5

def startTimer(room, room_id, username, drawers, gamesid, viewers):
    
    start = room["duaration"]
    count = 0
    while room["duaration"] != 0:
        room["duaration"] = room["duaration"] - 1
        time.sleep(1)
        count = count + 1
        print(room["duaration"])

    '''
    if start == count:
        drawer = next((drawer for drawer in drawers if drawer["id"] == room_id), None)
        curr_drawer = drawer["list"][drawer["index"]]
        for g in gamesid:
            if g["roomid"] == room_id:
                emit("game", "done$%*!" + room_id + "$%*!" + curr_drawer, room=g["roomid"])

        for p in viewers:
            if p["id"] == room_id:
                send("visible$%*!" + room_id, room=p["roomid"])
                emit("paint", "terminate$%*!" + p["username"] + "$%*!" + room_id, room=p["roomid"])
                print("sent terminate!")

        emit("paint", "terminate$%*!" + username + "$%*!" + room_id, room=drawer["id"])
        '''

    return None
