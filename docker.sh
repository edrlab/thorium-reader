#!/bin/sh

if [[ $(uname -m) == 'arm64' ]]; then
rm -f ./package.json.original
cp ./package.json ./package.json.original
sed 's/x64/arm64/g' ./package.json > ./package.json.new && mv ./package.json.new ./package.json
sed 's/linux-unpacked/linux-arm64-unpacked/g' ./package.json > ./package.json.new && mv ./package.json.new ./package.json
fi

docker version

docker info

# --no-cache
#--build-arg BUST_CACHE=$(date +%Y%m%d-%H%M%S)
#--build-arg BUST_CACHE=$(date +%s)
#--build-arg BUST_CACHE=`date +%s`
#--build-arg BUST_CACHE=1
docker build --progress=plain --build-arg BUST_CACHE=$(date +%Y%m%d-%H%M%S) -f ./Dockerfile -t thorium-docker-image .
# --platform linux/x86_64
# --platform=linux/amd64

#docker image ls

#docker ps -a

(docker stop thorium-docker-container || echo ok_stop) && echo _ok_stop

#(docker kill thorium-docker-container || echo ok_kill) && echo _ok_kill

(docker rm --force thorium-docker-container || echo ok_rm) && echo _ok_rm

npm run clean

# -d
# --log-driver=none -a stdin
# --log-driver=none -a stdout -a stderr
# | xargs echo DOCKER_OUT:
# --interactive -i
# --tty -t
# -it
# --platform linux/arm64
# --publish 8888:8888
# -p 127.0.0.1:9999:9999
# --volume list
# --detach
# --rm
docker run --name thorium-docker-container thorium-docker-image

# read -p "WAIT FOR DONE_PRESS_ENTER_KEY_NOW ..."

#docker logs -f thorium-docker-container

# docker exec -it thorium-docker-container /bin/sh

#(docker stop thorium-docker-container || echo ok_stop2) && echo _ok_stop2

#(docker kill thorium-docker-container || echo ok_kill2) && echo _ok_kill2

#(docker rm --force thorium-docker-container || echo ok_rm2) && echo _ok_rm2

# if [[ $(uname -m) == 'arm64' ]]; then
# sed 's/x64/arm64/g' ./package.json > ./package.json.new && mv ./package.json.new ./package.json
# sed 's/linux-unpacked/linux-arm64-unpacked/g' ./package.json > ./package.json.new && mv ./package.json.new ./package.json
# fi
# ??

# Thorium-2.4.0-alpha.1-arm64.AppImage
# EDRLab.ThoriumReader_2.4.0-alpha.1_arm64.deb
# Thorium-2.3.0.AppImage
# EDRLab.ThoriumReader_2.3.0_amd64.deb
# WILDCARDS GLOBS NOT SUPPORTED!
# docker cp thorium-docker-container:/THORIUM/release/*.AppImage .
# docker cp thorium-docker-container:/THORIUM/release/*.deb .

## EXEC requires a running container, whereas CP does not
# mkdir -p release || echo ok
# docker exec thorium-docker-container sh -c "tar -cf - /THORIUM/release/*.AppImage /THORIUM/release/*.deb" | tar --strip-components=2 -xf - -C release

FILENAME1=
FILENAME2=
VERSION=`cat package.json | grep 'version": ' | sed 's/  "version": "//' | sed 's/",//'`
if [[ $(uname -m) == 'arm64' ]]; then
FILENAME1="Thorium-"$VERSION"-arm64.AppImage"
FILENAME2="EDRLab.ThoriumReader_"$VERSION"_arm64.deb"
else
FILENAME1="Thorium-"$VERSION".AppImage"
FILENAME2="EDRLab.ThoriumReader_"$VERSION"_amd64.deb"
fi

echo $FILENAME1
echo $FILENAME2
mkdir -p release || echo ok
docker cp thorium-docker-container:/THORIUM/release/$FILENAME1 release
docker cp thorium-docker-container:/THORIUM/release/$FILENAME2 release

(docker stop thorium-docker-container || echo ok_stop) && echo _ok_stop
docker logs -f thorium-docker-container
docker logs thorium-docker-container

# docker exec -it thorium-docker-container /bin/sh

#(docker stop thorium-docker-container || echo ok_stop2) && echo _ok_stop2

#(docker kill thorium-docker-container || echo ok_kill2) && echo _ok_kill2

#(docker rm --force thorium-docker-container || echo ok_rm2) && echo _ok_rm2

if [[ $(uname -m) == 'arm64' ]]; then
rm -f ./package.json
mv ./package.json.original ./package.json
fi

git status
