#!/bin/sh

# https://github.com/apple/container
# container --version
# container system start
# container system status
# container system stop
# KEEP data:
# /usr/local/bin/uninstall-container.sh -k
# DELETE data:
# /usr/local/bin/uninstall-container.sh -d
#
#
#
#
# container builder status
# container builder start --cpus 7 --memory 12g
# container builder stop
# container builder delete
#
# container list --all
# container list --all | grep stopped | awk '{print $1}' | xargs -I {} container rm {}
# container prune
#

container --version
container system stop
container system start
container system status

container builder stop
container builder start --cpus 7 --memory 12g
container builder status

container list --all
# container list --all | grep stopped | awk '{print $1}' | xargs -I {} container rm {}
# container prune

echo "ARCHI: [$ARCHI]"
ARCH_SYS=$(uname -m)
echo "uname -m: [$ARCH_SYS]"
ARCHITECTURE=${ARCHI:-$ARCH_SYS}
echo "==> ARCHITECTURE: [$ARCHITECTURE]"

#$ arch ====> arm64
#$ uname -m ====> arm64
#$ env /usr/bin/arch -x86_64 /bin/zsh --login
#$ arch ====> i386
#$ uname -m ====> x86_64
#$ flox activate (ideally after clearing .flox caches and manifest lock)

if [[ ${ARCHITECTURE} == 'arm64' ]]; then
rm -f ./package.json.original
cp ./package.json ./package.json.original
sed 's/x64/arm64/g' ./package.json > ./package.json.new && mv ./package.json.new ./package.json
sed 's/linux-unpacked/linux-arm64-unpacked/g' ./package.json > ./package.json.new && mv ./package.json.new ./package.json
fi

container --version
container system status
container builder status
container list --all

# container images ls

# --no-cache
#--build-arg BUST_CACHE=$(date +%Y%m%d-%H%M%S)
#--build-arg BUST_CACHE=$(date +%s)
#--build-arg BUST_CACHE=`date +%s`
#--build-arg BUST_CACHE=1

if [[ ${ARCHITECTURE} == 'arm64' ]]; then
container build --cpus 7 --memory 12g --platform linux/arm64 --progress plain --build-arg BUST_CACHE=$(date +%Y%m%d-%H%M%S) -f ./Dockerfile -t thorium-docker-image .
else
container build --cpus 7 --memory 12g --platform linux/amd64 --progress plain --build-arg BUST_CACHE=$(date +%Y%m%d-%H%M%S) -f ./Dockerfile -t thorium-docker-image .
fi

container --version
container system status
container builder status
container list --all

# --platform linux/x86_64
# --platform=linux/amd64

#container image ls

#container ls -a

(container stop thorium-docker-container || echo ok_stop) && echo _ok_stop

#(container kill thorium-docker-container || echo ok_kill) && echo _ok_kill

(container rm --force thorium-docker-container || echo ok_rm) && echo _ok_rm

# npm run clean

#ARCHITECTURE=arm64
#echo $ARCHITECTURE

container builder stop
container builder status
container list --all

FILENAME1=
FILENAME2=
VERSION=`cat package.json | grep 'version": ' | sed 's/  "version": "//' | sed 's/",//'`
if [[ ${ARCHITECTURE} == 'arm64' ]]; then
FILENAME1="Thorium-"$VERSION"-arm64.AppImage"
FILENAME2="EDRLab.ThoriumReader_"$VERSION"_arm64.deb"
else
FILENAME1="Thorium-"$VERSION".AppImage"
FILENAME2="EDRLab.ThoriumReader_"$VERSION"_amd64.deb"
fi

echo $FILENAME1
echo $FILENAME2
mkdir -p release || echo ok

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
#
if [[ ${ARCHITECTURE} == 'arm64' ]]; then
container run --cpus 4 --memory 12g --platform linux/arm64 --name thorium-docker-container --volume ${PWD}/release:/MOUNT thorium-docker-image sh -c "ls -als /THORIUM/release/ ; ls -als /MOUNT/ ; cp /THORIUM/release/$FILENAME1 /MOUNT/ ; cp /THORIUM/release/$FILENAME2 /MOUNT/ ; ls -als /MOUNT/"
else
container run --cpus 4 --memory 12g --platform linux/amd64 --name thorium-docker-container --volume ${PWD}/release:/MOUNT thorium-docker-image sh -c "ls -als /THORIUM/release/ ; ls -als /MOUNT/ ; cp /THORIUM/release/$FILENAME1 /MOUNT/ ; cp /THORIUM/release/$FILENAME2 /MOUNT/ ; ls -als /MOUNT/"
fi


# read -p "WAIT FOR DONE_PRESS_ENTER_KEY_NOW ..."

#container logs -f thorium-docker-container

# container exec -it thorium-docker-container /bin/sh

#(container stop thorium-docker-container || echo ok_stop2) && echo _ok_stop2

#(container kill thorium-docker-container || echo ok_kill2) && echo _ok_kill2

#(container rm --force thorium-docker-container || echo ok_rm2) && echo _ok_rm2

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
# container cp thorium-docker-container:/THORIUM/release/*.AppImage .
# container cp thorium-docker-container:/THORIUM/release/*.deb .

## EXEC requires a running container, whereas CP does not
# mkdir -p release || echo ok
# container exec thorium-docker-container sh -c "tar -cf - /THORIUM/release/*.AppImage /THORIUM/release/*.deb" | tar --strip-components=2 -xf - -C release

#container cp thorium-docker-container:/THORIUM/release/$FILENAME1 release
#container cp thorium-docker-container:/THORIUM/release/$FILENAME2 release

(container stop thorium-docker-container || echo ok_stop) && echo _ok_stop
#container logs -f thorium-docker-container
#container logs thorium-docker-container

# container exec -it thorium-docker-container /bin/sh

#(container stop thorium-docker-container || echo ok_stop2) && echo _ok_stop2

#(container kill thorium-docker-container || echo ok_kill2) && echo _ok_kill2

#(container rm --force thorium-docker-container || echo ok_rm2) && echo _ok_rm2

if [[ ${ARCHITECTURE} == 'arm64' ]]; then
rm -f ./package.json
mv ./package.json.original ./package.json
fi

git status

container --version

container builder stop
container builder status

container list --all
container prune
container list --all | grep stopped | awk '{print $1}' | xargs -I {} container rm {}
container list --all

container system stop
container system status
