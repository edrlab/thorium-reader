# Readium Desktop

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/readium/readium-desktop.svg?branch=master)](https://travis-ci.org/readium/readium-desktop)

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

Before calling `npm start` (or `npm run start`), you must invoke the `npm run __postinstall` command (just once, so that the native libraries get build specifically for the Electron/NodeJS runtime).

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

## Import file from command line

```
npm run build:dev:main && npm run start:dev:main:electron -- --import-file=<path to epub or lcpl file>
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

## Debug main process from Visual Studio Code (renderer windows from web inspectors)

Simply use the pre-defined "LAUNCH ATTACH" definition in `launch.json`, which will perform the required build steps in order to prepare the main and renderer process bundles for debugging (there is a 30s timeout just in case compiling takes too long, but this may need to be increased on slow computers).
Technically, the automatically-called prerequisite for this launch configuration is `tasks.json` "launch:attach", which is an asynchronous task, thus why the debugger attachment waits for some time before giving-up. This launch configuration supports source maps, and the relative TypeScript file paths in compiler console messages can be clicked to reach into the source directly (for example when the renderer HotModulReload file watcher kicks-in, and generates errors). Note that the CLI functionality of Thorium / readium-desktop is bypassed in this special debugging mode, to avoid conflicts with Electron/Chromium's own command line parameters.

Note that the "LAUNCH HOT" definition does not currently work, due to the Electron app being started differently in order to follow sourcemaps (which results in some `require()` failing to resolve). So this is a placeholder configuration for illustration purposes only. In principle, the prerequisite for this launch configuration is to manunally invoke `npm run vscode:launch:hot` (or the equivalent `tasks.json` "launch:hot" shortcut from within Visual Studio Code).

## Localization / UI translations

https://github.com/readium/readium-desktop/tree/develop/src/resources/locales

* `npm run i18n-sort` => ensure locales JSON files are "canonical" (sorted keys, consistent indentation and last-line-break syntax)
* `npm run i18n-scan` => ensure locales JSON files have no missing keys and redundant/unused keys (this comnmand scans the source code for well-known `i18next` usage patterns)
* `npm run i18n-scan` => rebuilds the TypeScript types for the locales JSON files (which enables static compiler checks)
