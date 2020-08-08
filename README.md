# Thorium Reader

Thorium Reader is an easy to use EPUB reading application for Windows 10/10S, MacOS and Linux. After importing e-books from a directory or OPDS feed, you'll be able to read on any screen size, customize layout settings, navigate via the table of contents or page list, set bookmarks ... A great care is taken to ensure the accessibility of the application for visual impaired people using NVDA, JAWS or Narrator.

Free application. No ads. No private data flowing anywhere.

This project is in constant evolution, corrections and new features will be added soon and your support is welcome for that. The application is based on the open-source Readium Desktop toolkit. It is currently localized in three languages: English, French and German. More languages will come soon.

![library](img/library.png)
![publicqtion info](img/info.png)
![reader](img/reader.png)


## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/readium/readium-desktop.svg?branch=master)](https://travis-ci.org/readium/readium-desktop)

## Prerequisites

1) NodeJS >= 7 (check with `node --version`)
2) NPM >= 5.3 (check with `npm --version`)

## Quick start

In readium-desktop project

### Install readium-desktop dependencies

1) `npm install` (or `npm ci`): initialize local `node_modules` packages from dependencies declared in `package.json`

### Start application in dev environment

1) `npm run start:dev`

### Start application in production environment

1) `npm start` (or `npm run start`)

## Lint

It's very important (required) to launch lint before pushing any code on github repository

1) `npm run lint`

## Hot loader

In devlopment environment, the renderer process is hot loaded.
So if you made changes in your code, electron will automatically reload
your renderer view.

## Package

To package, create an installer for the application:

1) `npm run package:win` or `npm run package:mac` or `npm run package:linux`

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

## Command line

```
thorium <cmd> [args]

Commands:
  thorium opds <title> <url>  import opds feed
  thorium import <path>       import epub or lpcl file
  thorium read <title>        searches already-imported publications with the
                              provided TITLE, and opens the reader with the
                              first match
  thorium [path]              import and read an epub or lcpl file     [default]
  thorium completion          generate bash completion script

Positionals:
  path  path of your publication, it can be an absolute, relative path  [string]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
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

### JSON Schemas

Readium Web Publication Manifest:
https://github.com/readium/webpub-manifest/tree/master/schema

OPDS (v2):
https://github.com/opds-community/drafts/tree/master/schema

LCP:
https://github.com/readium/lcp-specs/tree/master/schema

Note that `r2-streamer-js` ships a not-too-out-of-date revision of the JSON Schemas, as they are used to validate JSON data when displayed via the browsing / conversion micro-services (which are currently not used in `readium-desktop`):

https://github.com/readium/r2-streamer-js/tree/develop/misc/json-schema

## Debug main process from Visual Studio Code (renderer windows from web inspectors)

Simply use the pre-defined "__ LAUNCH ATTACH" definition in `launch.json`, which will perform the required build steps ; via the regular WebPack configuration, including the dev server ; in order to prepare the main and renderer process bundles for debugging (there is a 30s timeout just in case compiling takes too long, but this may need to be increased on slow computers). The automatically-called prerequisite for this launch configuration is `tasks.json` "launch:attach", which is an asynchronous task (see the `npm run vscode:launch:attach` in `package.json`), thus why the debugger attachment waits for some time before giving-up. This launch configuration supports source maps, and the relative TypeScript file paths in compiler console messages can be clicked to reach into the source directly (for example when the renderer HotModulReload file watcher kicks-in, and generates errors). Note that the CLI functionality of Thorium / readium-desktop is bypassed in this special debugging mode, to avoid conflicts with Electron/Chromium's own command line parameters.

There is an alternative "__ LAUNCH HOT" definition in `launch.json` which leverages VSCode's ability to automatically bind a debugger instance and work out the TypeScript source mapping. The automatically-called prerequisite for this launch configuration is `npm run vscode:launch:hot` in `package.json` (or the equivalent `tasks.json` "launch:hot" definition). Note that in this case, the WebPack dev servers are started in external shells, instead of VSCode's integrated console or terminals.

In both cases, the main process automatically enters debugging mode, and breakpoints can be set early on. However, because there may be several renderer processes to debug ; typically: the library/bookshelf view, and the reader view(s) ; two separate launch tasks are defined: "CHROME DEBUG 1 (BOOKSHELF)" and "CHROME DEBUG 2 (READER)". They must be invoked manually in order to choose which target Chromium tab to debug into. Note that the web inspector of any Electron BrowserWindows can be opened at the same time, for example to use the React or Redux dev tools.

Important note: in order to debug into the Electron renderer process(es), the "Debugger for Chrome" extension must be installed in Visual Studio Code. More information:

* https://github.com/Microsoft/vscode-chrome-debug
* https://electronjs.org/docs/tutorial/debugging-main-process-vscode
* https://github.com/microsoft/vscode-recipes/tree/master/Electron

## Localization / UI translations

https://github.com/readium/readium-desktop/tree/develop/src/resources/locales

* `npm run i18n-sort` => ensure locales JSON files are "canonical" (sorted keys, consistent indentation and trailing line break)
* `npm run i18n-scan` => ensure locales JSON files have no missing keys and no superfluous/unused keys (this command analyzes the source code to search for well-known `i18next` usage patterns)
* `npm run i18n-check` => ensure "secondary" locales JSON files have no missing keys and no superfluous keys, relative to the "primary" English translation. Missing keys are automatically added with an empty string value, redundant keys are removed.
* `npm run i18n-typed` => rebuilds the TypeScript types for the locales JSON files (this enables static compiler checks)
