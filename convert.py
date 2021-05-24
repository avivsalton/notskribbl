import os
from os import listdir
from os.path import isfile, join
import numpy as np
import requests
from clint.textui import progress
import tqdm
import cv2
import random

def download(url: str, fname: str):
    response = requests.get(url, stream=True)
    total_size_in_bytes = int(response.headers.get('content-length', 0))
    block_size = 1024  # 1 Kibibyte
    progress_bar = tqdm.tqdm(total=total_size_in_bytes, unit='iB', unit_scale=True)
    with open(fname, 'wb') as file:
        for data in response.iter_content(block_size):
            progress_bar.update(len(data))
            file.write(data)
    progress_bar.close()
    if total_size_in_bytes != 0 and progress_bar.n != total_size_in_bytes:
        print("ERROR, something went wrong")

base = "https://storage.googleapis.com/quickdraw_dataset/full/numpy_bitmap/"
subjects = ['apple', 'ant', 'banana', 'barn', 'car', 'guitar', 'hourglass', 'house', 'pencil', 'tree']

'''for s in subjects:
    filename = s + '.npy'
    url = base + filename
    print("downloading " + filename + "...")
    download(url, "dataset\\" +filename)
    print("done")'''

onlyfiles = [f for f in listdir("dataset") if isfile(join("dataset", f))]
for file in onlyfiles:
    print(file)
    foldername = file.replace(".npy","")
    os.mkdir("dataset\\" + foldername)
    x = np.load("dataset\\" + file)
    index = 0

    for pic in x:
        array = np.reshape(pic, (28, 28))
        name = str(random.randint(1111,9999999)) + ".jpg"
        while os.path.isfile("dataset\\" + foldername + "\\" + name):
            name = str(random.randint(1111, 9999999)) + ".jpg"
        cv2.imwrite("dataset\\" + foldername + "\\" +name, array)

        if index == 20000:
            break
        else:
            index = index + 1