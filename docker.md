## Run the builded docker-container (in this example, "mongo" is container name)
    docker run -v /Users/sitchikhin/Projects/mongodb-db/:/data/db/ -d -p 27017:27017 --name mongodb-server mongo

## Exec command into docker-container
    docker exec -it mongodb-server bash

    docker ps -a
    docker rm -f mongodb-server

## generate new container from dockerfile
    docker build -t <my-app-name> /folder/name

## copy files into docker container
    docker cp file.name mongodb-server:/data/folder/name

## show list of contents files/directory in folder name
    ls -l folder/name

## Start/stop MongoDB on MacOS with Homebrew
    brew services start mongodb-community@4.4
    brew services stop mongodb-community@4.4

## Show listener on TCP Port on Mac
    lsof -nP -i4TCP:81 | grep LISTEN 


## PDF-Service

    docker build -t sitchikhin/pdf-service .
    docker run -v /Users/sitchikhin/Projects/digibro/realty-guide/docker-results:/app/static/result -d -p 8000:8000 --name pdf-service pdf-service
    docker run -d -p 3000:8000 --name pdf-service sitchikhin/pdf-service
    docker rm -f pdf-service
    docker exec -it pdf-service bash
