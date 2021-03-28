import random

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

