enum(SCREENSHOT, WEBCAM, COMMAND)

# CLIENT

send(SCREENSHOT + "#$%^&*" + data)

# SERVER

msg = socket.receive(1024)
splited = msg.split("#$%^&*")

if splited[0] == SCREENSHOT:
	#SCREENSHOT COMMAND