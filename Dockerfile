# Jammy Jellyfish
# GLIBC 2.32
# FROM ubuntu:22.04

# Focal Fossa
# GLIBC 2.31
FROM ubuntu:20.04
# Note GitHub Actions: "The Ubuntu 20.04 runner image will be fully unsupported by April 1, 2025"

# Bionic Beaver
# GLIBC 2.27
#FROM ubuntu:18.04

# Disco Dingo
# GLIBC 2.28
#FROM ubuntu:19.04

# Debian Buster
# GLIBC 2.28
# FROM node:20-buster

#ENTRYPOINT ["kill", "-s", "SIGKILL", "1"]

USER root

# ARG DEBIAN_FRONTEND=noninteractive
# ENV DEBIAN_FRONTEND=noninteractive

RUN echo $CONTAINER_TIMEZONE && arch && uname &&\
    apt-get update -y &&\
    apt-get upgrade -y &&\
    ln -snf /usr/share/zoneinfo/$CONTAINER_TIMEZONE /etc/localtime &&\
    echo $CONTAINER_TIMEZONE > /etc/timezone &&\
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends tzdata &&\
    apt-get install -y build-essential bsdmainutils curl \
    ruby-dev && gem i fpm -f && fpm --version &&\
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash &&\
    apt-get install -y nodejs &&\
    npm install --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root -g sfw &&\
    npm config get prefix &&\
    echo "$NPM_CONFIG_PREFIX" &&\
    export NPM_CONFIG_PREFIX=$(npm config get prefix) &&\
    echo "$NPM_CONFIG_PREFIX" &&\
    export PATH="${NPM_CONFIG_PREFIX}/bin:$PATH" &&\
    (ls -alshFR --color=auto "${NPM_CONFIG_PREFIX}/lib/node_modules/sfw/.sfw-cache" || echo OK) &&\
    sfw npm install --global --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root npm@11.x &&\
    (ls -alshFR --color=auto "${NPM_CONFIG_PREFIX}/lib/node_modules/sfw/.sfw-cache" || echo OK)
# https://github.com/npm/cli/issues/9133

# wget libreadline-dev
# libc6 xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0 libappindicator3-1
RUN apt-get install libnotify4 libdrm2 libgbm1 libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 -yq --no-install-suggests --no-install-recommends &&\
    apt-get clean &&\
    rm -rf /var/lib/apt/lists/*

# Could not open '/lib/ld-linux.so.2': No such file or directory
# FPM x86 fallback in ElectronBuilder :(
# https://github.com/develar/app-builder/issues/85#issue-1443790296
# https://github.com/signalapp/Signal-Desktop/issues/6063#issuecomment-1307001166
# apt-get install -y ruby-dev && gem i fpm -f && fpm --version
# export USE_SYSTEM_FPM=true

ARG BUST_CACHE
RUN arch &&\
    uname &&\
    free -m &&\
    free -g &&\
#    lsb_release -a &&\
    ldd --version &&\
    node --version &&\
    npm --version

RUN groupadd -g 1100 notroot &&\
    useradd -g notroot -m -u 1100 notroot -s /bin/sh -d /THORIUM &&\
    usermod -a -G audio,video notroot
USER notroot

WORKDIR /THORIUM

ARG BUST_CACHE
RUN rm -rf /THORIUM/* &&\
    ls -alsR /THORIUM

# EXPOSE 8888

COPY ./typings* /THORIUM/
COPY ./tsconfig* /THORIUM/
COPY ./package* /THORIUM/
COPY ./customization-profile-public-key-pair* /THORIUM/
COPY ./pat* /THORIUM/
COPY ./jest* /THORIUM/
COPY ./eslint* /THORIUM/
COPY ./.stylelint* /THORIUM/
COPY ./.prettier* /THORIUM/
COPY ./.npm* /THORIUM/
COPY ./.eslint* /THORIUM/
COPY ./.editor* /THORIUM/
COPY ./webpack* /THORIUM/
ADD ./external-assets /THORIUM/external-assets
ADD ./src /THORIUM/src
ADD ./scripts /THORIUM/scripts
ADD ./resources /THORIUM/resources
ADD ./img /THORIUM/img

USER root

RUN chown -R notroot:notroot /THORIUM/ &&\
    ls -als /THORIUM

USER notroot

# use this only for dev/debug builds! (simulates CI)
# ENV RELEASE_TAG=xyz

# Electron Builder workaround
# ENV USE_HARD_LINKS="false"

ARG BUST_CACHE
RUN cd /THORIUM/ &&\
    sfw npm ci --ignore-scripts --foreground-scripts --min-release-age=3 --allow-git=root &&\
    cd node_modules/electron &&\
    npm run postinstall &&\
    cd ../.. &&\
    (ls -alshFR --color=auto "$NPM_CONFIG_PREFIX/lib/node_modules/sfw/.sfw-cache" || echo OK) &&\
    (npm audit || echo OK) &&\
    ((npm exec --no --offline -- taze --maturity-period 3 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd . && npm exec --no --offline -- taze major --maturity-period 3 --fail-on-outdated --all --force --include-locked --concurrency 10 --loglevel debug --cwd .) || echo OK)

ARG BUST_CACHE
RUN cd /THORIUM/ &&\
    ./node_modules/electron/dist/electron --no-sandbox --version &&\
    ./node_modules/electron/dist/electron --no-sandbox --abi
# Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory

# RUN ls -als -R /THORIUM
# CMD exec ls -als /THORIUM
# RUN echo $(ls -als /THORIUM)
# CMD exec echo $(ls -als /THORIUM)
# ls -alsR /THORIUM/

ARG BUST_CACHE
RUN cd /THORIUM/ &&\
    npm run clean && export USE_SYSTEM_FPM=true; npm run package:linux && ls -als release
