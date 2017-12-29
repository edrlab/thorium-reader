# Readium Desktop

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/edrlab/readium-desktop.svg?branch=master)](https://travis-ci.org/edrlab/readium-desktop)

## Prerequisites

1) NodeJS >= 7 (check with `node --version`)
2) NPM >= 5.3 (check with `npm --version`)

## Quick start

In readium-desktop project

### Install readium-desktop dependencies

1) `npm install` (initialize local `node_modules` packages from dependencies declared in `package.json`)

### Start application in dev environment

1) `npm run start:dev`

### Start application in production environment

1) `npm start`

## Lint

It's very important (required) to launch lint before pushing any code on github repository

1) `npm run lint`

## Hot loader

In devlopment environment, the renderer process is hot loaded.
So if you made changes in your code, electron will automatically reload
your renderer view.

## Package

To package, create an installer for the application:

1) `npm run package`

## Useful commands

### Upgrade global packages

1) `npm update --global` (sync NPM global packages)

### Upgrade readium desktop packages

1) `npm update` (sync local packages)
2) `npm install`

### Update npm for windows

You cannot update npm using `npm install -g npm@latest`

Run PowerShell as Administrator and type these commands:

```
Set-ExecutionPolicy Unrestricted -Scope CurrentUser -Force
npm install -g npm-windows-upgrade
npm-windows-upgrade
```

### Compile native modules on Windows

To compile native modules, like leveldown for production use, you have to
install all the visual C++ toochain.

To do it, launch the powershell as an administrator and type:

```
npm install -g windows-build-tools
```

## Issues

### Webpack dev server on OSX

On OSX, webpack dev server has a high CPU usage.
To prevent this install fsevents

```
npm install -g fsevents
```

### NPM 5.4 on windows

NPM 5.4 on windows does not work as expected and generates some permission issues:
https://github.com/npm/npm/issues/18380

### Unable to use electron-builder

https://github.com/electron-userland/electron-builder/issues/993

#### Workaround 1
Install xorriso `sudo apt-get install xorriso -y` and `set env USE_SYSTEM_XORRISO=true` (10.13.1+)

#### Workaround 2
```
cd /lib/x86_64-linux-gnu
sudo ln -s libreadline.so.7.0 libreadline.so.6
```

## Technologies

* typescript
* electron
* reactjs
* redux
* saga
* pouchdb
* i18next

## Pouchdb adapters

We provide 2 adapaters for the database storage

### Jsondown

Jsondown is designed for the development environment.
It is useful if you want to use the application without installing any dev tools
like Visual C++
Warning: Do not use it in production environment

### Leveldown

Leveldown is fast and is shipped in the production environment.

## Others

### OPDS Feed

```
http://www.feedbooks.com/books/top.atom?category=FBFIC019000
```

## Debug in VS Code

Launcher:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Program",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceRoot}",
      "program": "${workspaceRoot}/src/main.ts",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron.cmd"
      },
      "args" : ["."],
      "outFiles": [
        "${workspaceRoot}/dist/main.js"
      ],
      "sourceMaps": true
    }
  ]
}
```

Launch command: `npm run build:dev:main`

Then launch debugger in vs code
