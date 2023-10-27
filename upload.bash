#!/bin/bash


upload_frontend() {
    echo "[UPLOADING FRONTEND] Make sure you npm run build!"
    rsync -rav -e "ssh -i id_rsa" ./frontend/cowboy/dist/* root@donate-idf.com:/home/app
    echo "[--- UPLOADED FRONTEND ---]"
}

upload_server() {
    echo "[UPLOADING SERVER]"
    rsync -rav --exclude="__pycache__" -e "ssh -i id_rsa" ./server/* root@donate-idf.com:/home/server
    echo "[--- UPLOADED SERVER ---]"
}

# Check command-line arguments and execute the appropriate function
if [ $# -eq 0 ]; then
    upload_frontend
    upload_server
elif [ "$1" == "app" ]; then
    upload_frontend
elif [ "$1" == "server" ]; then
    upload_server
else
    echo "Usage: $0 [app|server]"
    exit 1
fi

