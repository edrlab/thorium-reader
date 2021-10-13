# Thorium Reader

Thorium Reader is an easy to use EPUB reading application for Windows 10/10S, MacOS and Linux. After importing e-books from a directory or OPDS feed, you'll be able to read on any screen size, customize layout settings, navigate via the table of contents or page list, set bookmarks ... A great care is taken to ensure the accessibility of the application for visual impaired people using NVDA, JAWS or Narrator.

Free application. No ads. No private data flowing anywhere.

This project is in constant evolution, corrections and new features will be added soon and your support is welcome for that. The application is based on the open-source Readium Desktop toolkit.

It is currently localized in following languages:
- English
- French
- Portuguese
- Swedish
- Russian
- Lithuanian
- Italian
- Japanese
- Dutch
- Spanish
- German
- Finnish
- Chinese
- Korean
- Georgian

See: https://github.com/edrlab/thorium-reader/wiki/Localization-(l10n)-language-translations

![library](img/library.png)
![publication info](img/info.png)
![reader](img/reader.png)

## Build status

TravisCI, `develop` branch:

[![Build Status](https://travis-ci.org/edrlab/thorium-reader.svg?branch=master)](https://travis-ci.org/edrlab/thorium-reader)

## Prerequisites

1) NodeJS 14 (check with `node --version`)
2) NPM 6 (check with `npm --version`)
3) C++ compiler for native NodeJS modules (SQLite3 and LevelDown database backends), should work out of the box in Linux and MacOS. On Windows Visual Studio can be installed or simply call `npm install -g windows-build-tools`.

## Technologies

* typescript
* electron
* reactjs
* redux
* saga
* pouchdb
* i18next

## Quick start

### Install dependencies

* `npm install` (or `npm ci`): initialize local `node_modules` packages from dependencies declared in `package.json` (this will also automatically call a long-running compilation stage in `npm run postinstall`)

### Start application in development environment

(with hot-reload dev server, web inspectors / debuggers)

* `npm run start:dev` (or `npm run start:dev:quick` to bypass TypeScript checks / launch the app faster)

### Start application in production environment

* `npm start` (or `npm run start`)

## Build installers

* `npm run package:win` or `npm run package:mac` or `npm run package:linux`

Code Signing information: https://github.com/edrlab/thorium-reader/wiki/Code-Signing

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
